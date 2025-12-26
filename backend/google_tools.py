from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from datetime import datetime
import io
import os
import math

SCOPES = [
    "https://www.googleapis.com/auth/presentations",
    "https://www.googleapis.com/auth/drive"
]

def _get_fresh_clients():
    """Create fresh API clients."""
    creds = service_account.Credentials.from_service_account_file(
        "service_account.json",
        scopes=SCOPES
    )
    return build("slides", "v1", credentials=creds, cache_discovery=False), build("drive", "v3", credentials=creds, cache_discovery=False)


# ---------------------------
# CONSTANTS
# ---------------------------

SHARED_DRIVE_ID = "0ANbjsu5dzp0bUk9PVA"
EMU_PER_INCH = 914400

# Font size lookup table calibrated for 5.88" x 3.01" textbox
FONT_SIZE_TABLE = {
    12:  {"chars_per_line": 85,  "max_lines": 13},
    11:  {"chars_per_line": 95,  "max_lines": 14},
    10:  {"chars_per_line": 105, "max_lines": 16},
    9:   {"chars_per_line": 125, "max_lines": 17},
    8:   {"chars_per_line": 135, "max_lines": 19},
    7.5: {"chars_per_line": 147, "max_lines": 21},
    7:   {"chars_per_line": 160, "max_lines": 22},
}

BASE_TEXTBOX_WIDTH = 5.88   # inches
BASE_TEXTBOX_HEIGHT = 3.01  # inches


# ---------------------------
# HELPER FUNCTIONS
# ---------------------------

def _replace_on_slide(placeholder, value, slide_id):
    """Build a replaceAllText request for a placeholder."""
    return {
        "replaceAllText": {
            "containsText": {"text": placeholder, "matchCase": True},
            "replaceText": str(value) if value else "",
            "pageObjectIds": [slide_id]
        }
    }


def _extract_text_from_shape(shape):
    """Return the concatenated text content for a shape's text elements."""
    if not shape or "text" not in shape:
        return ""
    return "".join(
        te["textRun"]["content"]
        for te in shape["text"].get("textElements", [])
        if "textRun" in te and te["textRun"].get("content")
    )


def _find_content_shape(presentation, slide_id):
    """Find the content textbox shape (MESSAGE, RECIPIENT_NAME, or SENDER_NAME).
    
    Returns dict with objectId, width_inches, height_inches, or None if not found.
    """
    content_placeholders = ["{{MESSAGE}}", "{{RECIPIENT_NAME}}", "{{SENDER_NAME}}"]
    
    for slide in presentation.get("slides", []):
        if slide.get("objectId") != slide_id:
            continue
        for pe in slide.get("pageElements", []):
            shape = pe.get("shape")
            if not shape:
                continue
            text = _extract_text_from_shape(shape)
            
            # Check if this shape contains any content placeholder
            if any(ph in text for ph in content_placeholders):
                size = pe.get("size", {})
                transform = pe.get("transform", {})
                
                # Calculate actual dimensions (base size * transform scale)
                scale_x = transform.get("scaleX", 1.0)
                scale_y = transform.get("scaleY", 1.0)
                
                width_inches = (size["width"]["magnitude"] * scale_x / EMU_PER_INCH 
                               if "width" in size and "magnitude" in size["width"] else None)
                height_inches = (size["height"]["magnitude"] * scale_y / EMU_PER_INCH
                                if "height" in size and "magnitude" in size["height"] else None)
                
                return {
                    "objectId": pe.get("objectId"),
                    "width_inches": width_inches,
                    "height_inches": height_inches
                }
    return None


def _compute_font_size(text, textbox_width_inches=None, textbox_height_inches=None):
    """Compute optimal font size based on text content and textbox dimensions."""
    if not text:
        return 12
    
    # Calculate scale factors based on textbox size
    width_scale = (textbox_width_inches / BASE_TEXTBOX_WIDTH) if textbox_width_inches else 1.0
    height_scale = (textbox_height_inches / BASE_TEXTBOX_HEIGHT) if textbox_height_inches else 1.0
    
    lines = text.split("\n")
    
    # Try each font size from largest to smallest
    for font_size in sorted(FONT_SIZE_TABLE.keys(), reverse=True):
        chars_per_line = int(FONT_SIZE_TABLE[font_size]["chars_per_line"] * width_scale)
        max_lines = int(FONT_SIZE_TABLE[font_size]["max_lines"] * height_scale)
        
        # Calculate total wrapped lines at this font size
        total_wrapped_lines = sum(
            1 if not line else math.ceil(len(line) / chars_per_line)
            for line in lines
        )
        
        if total_wrapped_lines <= max_lines:
            return font_size
    
    # If nothing fits, use smallest available
    return min(FONT_SIZE_TABLE.keys())


# ---------------------------
# CORE FUNCTIONS
# ---------------------------

def _duplicate_template(presentation_id, title, drive_client):
    """Duplicate a template presentation to Shared Drive.
    
    Returns the copied presentation ID.
    """
    copied_file = drive_client.files().copy(
        fileId=presentation_id,
        supportsAllDrives=True,
        body={
            "name": title,
            "driveId": SHARED_DRIVE_ID,
        }
    ).execute()
    return copied_file["id"]


def _duplicate_slide(presentation_id, slide_id):
    """Duplicate a slide within a presentation.
    
    Returns the new slide's object ID.
    """
    response = slides.presentations().batchUpdate(
        presentationId=presentation_id,
        body={
            "requests": [{
                "duplicateObject": {
                    "objectId": slide_id
                }
            }]
        }
    ).execute()
    return response["replies"][0]["duplicateObject"]["objectId"]


def _get_template_slide_id(card, all_slide_ids, attachment_id_to_slide_index):
    """Get the appropriate template slide ID for a card based on its attachment.
    
    Returns:
        The slide ID to use as template
    """
    attachment_id = card.get("attachment_id") or "default"
    slide_index = attachment_id_to_slide_index.get(attachment_id, 0)
    
    # Ensure slide index is valid, fall back to default (0) if not
    if slide_index >= len(all_slide_ids):
        slide_index = 0
    
    return all_slide_ids[slide_index]


def _apply_card_replacements(presentation_id, slide_id, card, slides_client, include_font_sizing=True, content_shape=None):
    """Apply all text replacements and font sizing for a single card.
    
    Args:
        presentation_id: Google Slides presentation ID
        slide_id: Slide object ID to apply replacements to
        card: Card dict with recipient_email, recipient_name, message_content, sender_name
        slides_client: Google Slides API client
        include_font_sizing: Whether to compute and apply font sizing
        content_shape: Optional pre-fetched content shape info (for batch optimization)
        
    Returns:
        List of batchUpdate requests
    """
    net_id = card["recipient_email"].split("@")[0] if card.get("recipient_email") else ""
    
    requests = [
        _replace_on_slide("{{NET_ID}}", net_id, slide_id),
        _replace_on_slide("{{RECIPIENT_NAME}}", card.get("recipient_name", ""), slide_id),
        _replace_on_slide("{{MESSAGE}}", card.get("message_content", ""), slide_id),
        _replace_on_slide("{{SENDER_NAME}}", card.get("sender_name", ""), slide_id),
    ]
    
    if include_font_sizing:
        # Use provided shape info or fetch it
        if content_shape is None:
            # For single card processing, fetch shape info
            presentation = slides_client.presentations().get(presentationId=presentation_id).execute()
            content_shape = _find_content_shape(presentation, slide_id)
        
        if content_shape:
            combined_text = "\n".join([
                f"To: {card.get('recipient_name', '')}",
                "",
                str(card.get("message_content", "")),
                "",
                f"From: {card.get('sender_name', '')}"
            ])
            
            font_size = _compute_font_size(
                combined_text,
                content_shape["width_inches"],
                content_shape["height_inches"]
            )
            
            requests.append({
                "updateTextStyle": {
                    "objectId": content_shape["objectId"],
                    "style": {"fontSize": {"magnitude": font_size, "unit": "PT"}},
                    "textRange": {"type": "ALL"},
                    "fields": "fontSize"
                }
            })
    
    return requests


# ---------------------------
# PUBLIC FUNCTIONS
# ---------------------------

def cards_to_pdf(presentation_id, cards, output_filepath, message_group=None):
    """Generate PDF from one or more cards using Google Slides template.
    
    Supports multiple slides in template for different attachments:
    - Slide 1: default (no attachment)
    - Slide 2+: attachment-specific slides in order of attachment IDs
    
    For single cards: Creates temporary presentation, exports PDF, then trashes it.
    For multiple cards: Duplicates slides for each card, exports PDF, keeps presentation.
    
    Args:
        presentation_id: Google Slides template ID (must be in Shared Drive)
        cards: List of one or more card dicts
        output_filepath: Local path to save PDF (without .pdf extension)
        message_group: Override message group for attachment lookup (defaults to cards[0].message_group)
    
    Returns:
        The presentation ID if multiple cards (not deleted), None if single card (trashed)
    """
    if len(cards) == 0:
        raise ValueError("Must provide at least one card")

    # Create fresh API clients for this request to avoid SSL connection issues
    slides, drive = _get_fresh_clients()

    is_single_card = len(cards) == 1
    
    # Use provided message_group or default to first card's message_group
    if message_group is None:
        message_group = cards[0].get("message_group")
    
    # Get attachments for this message group to build slide mapping
    from app import get_db_connection
    conn = get_db_connection()
    attachments = conn.execute("select * from attachments where message_group=? order by id desc",
                              (message_group,)).fetchall()
    conn.close()
    
    # Build attachment_id -> slide_index mapping
    # Slide indices are 0-based: slide 0 = default, slide 1+ = attachments
    attachment_id_to_slide_index = {"default": 0}
    for idx, attachment in enumerate(attachments):
        attachment_id_to_slide_index[attachment['id']] = idx + 1
    
    # Copy the template to Shared Drive
    title = f"Lifted Card {cards[0].get('id', 'temp')}" if is_single_card else \
            f"Lifted Cards - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    copied_presentation_id = _duplicate_template(presentation_id, title, drive)

    try:
        # Get the presentation
        presentation = slides.presentations().get(presentationId=copied_presentation_id).execute()
        all_slide_ids = [slide["objectId"] for slide in presentation["slides"]]
        
        if is_single_card:
            # Single card: select the appropriate slide and replace on it
            card = cards[0]
            slide_id = _get_template_slide_id(card, all_slide_ids, attachment_id_to_slide_index)
            
            requests = _apply_card_replacements(
                copied_presentation_id,
                slide_id,
                card,
                slides,
                include_font_sizing=True
            )
            slides.presentations().batchUpdate(
                presentationId=copied_presentation_id,
                body={"requests": requests}
            ).execute()
            
            # Delete all other slides
            slide_index = all_slide_ids.index(slide_id)
            delete_requests = [
                {"deleteObject": {"objectId": sid}}
                for i, sid in enumerate(all_slide_ids) if i != slide_index
            ]
            if delete_requests:
                slides.presentations().batchUpdate(
                    presentationId=copied_presentation_id,
                    body={"requests": delete_requests}
                ).execute()
        else:
            # Multiple cards: batch all operations together
            # Note: batchUpdate counts as ONE write request regardless of operations inside
            # Reduced batch size to prevent timeouts with large requests
            num_cards = len(cards)
            MAX_BATCH_SIZE = 150
            
            # Build all duplicate requests upfront
            all_duplicate_requests = []
            card_to_template_mapping = []
            
            for card in cards:
                template_slide_id = _get_template_slide_id(card, all_slide_ids, attachment_id_to_slide_index)
                
                card_to_template_mapping.append({
                    "card": card,
                    "template_slide_id": template_slide_id
                })
                
                all_duplicate_requests.append({
                    "duplicateObject": {"objectId": template_slide_id}
                })
            
            # Batch duplicate slides (split into chunks of 150 if needed)
            print(f"Duplicating {num_cards} slides...")
            
            new_slide_ids = []
            for batch_start in range(0, len(all_duplicate_requests), MAX_BATCH_SIZE):
                batch_end = min(batch_start + MAX_BATCH_SIZE, len(all_duplicate_requests))
                batch_requests = all_duplicate_requests[batch_start:batch_end]
                
                # Progress: 0-25% for duplication
                progress = round((batch_start / num_cards) * 25, 2)
                with open(f"{output_filepath}.txt", "a") as file:
                    file.write(f"\n{progress}% duplicating slides ({batch_start}/{num_cards})")
                print(f"{progress}% duplicating slides ({batch_start}/{num_cards})")
                
                response = slides.presentations().batchUpdate(
                    presentationId=copied_presentation_id,
                    body={"requests": batch_requests}
                ).execute()
                
                # Collect new slide IDs from duplication responses
                for reply in response.get("replies", []):
                    if "duplicateObject" in reply:
                        new_slide_ids.append(reply["duplicateObject"]["objectId"])
            
            with open(f"{output_filepath}.txt", "a") as file:
                file.write(f"\n25% all slides duplicated")
            
            # Fetch presentation once to get both template and duplicated slide shapes
            print("Fetching slide shapes for font sizing...")
            updated_presentation = slides.presentations().get(presentationId=copied_presentation_id).execute()
            
            # Cache template dimensions (for font size calculation)
            unique_template_ids = list(set(all_slide_ids))
            template_dimensions_cache = {}
            for template_id in unique_template_ids:
                template_dimensions_cache[template_id] = _find_content_shape(updated_presentation, template_id)
            
            # Build shape map for all duplicated slides (with correct objectIds)
            duplicated_shapes_map = {}
            for new_slide_id in new_slide_ids:
                duplicated_shapes_map[new_slide_id] = _find_content_shape(updated_presentation, new_slide_id)
            
            # Build all replacement requests
            print(f"Applying replacements to {num_cards} slides...")
            
            all_replacement_requests = []
            for i, mapping in enumerate(card_to_template_mapping):
                # Progress: 25-50% for building replacements
                if i % 50 == 0:
                    progress = 27 + round((i / num_cards) * 23, 2)
                    with open(f"{output_filepath}.txt", "a") as file:
                        file.write(f"\n{progress}% building replacements ({i}/{num_cards})")
                    print(f"{progress}% building replacements ({i}/{num_cards})")
                
                # Build content_shape with objectId from duplicated slide, dimensions from template
                dup_shape = duplicated_shapes_map.get(new_slide_ids[i])
                tmpl_shape = template_dimensions_cache.get(mapping["template_slide_id"])
                
                content_shape = None
                if dup_shape and tmpl_shape:
                    content_shape = {
                        "objectId": dup_shape["objectId"],
                        "width_inches": tmpl_shape["width_inches"],
                        "height_inches": tmpl_shape["height_inches"]
                    }
                elif dup_shape:
                    content_shape = dup_shape
                
                requests = _apply_card_replacements(
                    copied_presentation_id,
                    new_slide_ids[i],
                    mapping["card"],
                    slides,
                    include_font_sizing=True,
                    content_shape=content_shape
                )
                all_replacement_requests.extend(requests)
            
            with open(f"{output_filepath}.txt", "a") as file:
                file.write(f"\n50% applying replacements to slides")
            
            # Apply all replacements in batches (split into chunks of 500 if needed)
            for batch_start in range(0, len(all_replacement_requests), MAX_BATCH_SIZE):
                batch_end = min(batch_start + MAX_BATCH_SIZE, len(all_replacement_requests))
                batch_requests = all_replacement_requests[batch_start:batch_end]
                
                # Progress: 50-65% for applying replacements
                progress = 50 + round((batch_start / len(all_replacement_requests)) * 15, 2)
                with open(f"{output_filepath}.txt", "a") as file:
                    file.write(f"\n{progress}% applying replacements ({batch_start}/{len(all_replacement_requests)} operations)")
                print(f"{progress}% applying replacements ({batch_start}/{len(all_replacement_requests)} operations)")
                
                slides.presentations().batchUpdate(
                    presentationId=copied_presentation_id,
                    body={"requests": batch_requests}
                ).execute()
            
            # Reorder slides using new_slide_ids (before deleting templates)
            with open(f"{output_filepath}.txt", "a") as file:
                file.write(f"\n65% reordering slides")
            
            reorder_requests = [
                {"updateSlidesPosition": {"slideObjectIds": [slide_id], "insertionIndex": i}}
                for i, slide_id in enumerate(new_slide_ids)
            ]
            
            slides.presentations().batchUpdate(
                presentationId=copied_presentation_id,
                body={"requests": reorder_requests}
            ).execute()
            
            # Delete all original template slides
            with open(f"{output_filepath}.txt", "a") as file:
                file.write(f"\n70% cleaning up template slides")
            
            delete_requests = [
                {"deleteObject": {"objectId": sid}}
                for sid in all_slide_ids
            ]
            slides.presentations().batchUpdate(
                presentationId=copied_presentation_id,
                body={"requests": delete_requests}
            ).execute()
        
        # Export to PPTX for multiple cards (skip if too large)
        if not is_single_card:
            try:
                print("Exporting to PPTX...")
                with open(f"{output_filepath}.txt", "a") as file:
                    file.write(f"\n70% exporting to PPTX")

                pptx_request = drive.files().export_media(
                    fileId=copied_presentation_id,
                    mimeType="application/vnd.openxmlformats-officedocument.presentationml.presentation"
                )
                
                pptx_fh = io.BytesIO()
                pptx_downloader = MediaIoBaseDownload(pptx_fh, pptx_request)
                done = False
                while not done:
                    _, done = pptx_downloader.next_chunk()
                
                # Save PPTX
                with open(output_filepath + ".pptx", "wb") as f:
                    f.write(pptx_fh.getvalue())
                
                print("PPTX exported successfully")
            except Exception as e:
                # Skip PPTX if export fails (usually due to size limit)
                error_msg = str(e)
                if "exportSizeLimitExceeded" in error_msg or "too large" in error_msg.lower():
                    print("PPTX export skipped: file too large (exceeds 100 MB limit)")
                    with open(f"{output_filepath}.txt", "a") as file:
                        file.write(f"\n75% PPTX skipped (too large)")
                else:
                    print(f"PPTX export failed: {error_msg}")
                    with open(f"{output_filepath}.txt", "a") as file:
                        file.write(f"\n75% PPTX export failed")
            
            with open(f"{output_filepath}.txt", "a") as file:
                file.write(f"\n85% exporting to PDF")
        
        # Export to PDF
        print("Exporting to PDF...")
        pdf_request = drive.files().export_media(
            fileId=copied_presentation_id,
            mimeType="application/pdf"
        )
        
        pdf_fh = io.BytesIO()
        pdf_downloader = MediaIoBaseDownload(pdf_fh, pdf_request)
        done = False
        while not done:
            _, done = pdf_downloader.next_chunk()
        
        # Save PDF
        os.makedirs(os.path.dirname(output_filepath), exist_ok=True)
        with open(output_filepath + ".pdf", "wb") as f:
            f.write(pdf_fh.getvalue())
        
        print("Export complete!")
        
        if not is_single_card:
            with open(f"{output_filepath}.txt", "a") as file:
                file.write(f"\n100% complete")
        
        # Only trash for single cards
        if is_single_card:
            drive.files().update(
                fileId=copied_presentation_id,
                body={'trashed': True},
                supportsAllDrives=True
            ).execute()
            return None
        else:
            return copied_presentation_id
        
    except Exception as e:
        # If something fails, keep the presentation for debugging
        print(f"Error occurred, presentation kept: {copied_presentation_id}")
        raise e

