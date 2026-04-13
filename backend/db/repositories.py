import json
from datetime import datetime, timezone
from sqlalchemy import select, func, distinct, update, text, insert, delete, or_
from db.models import (
    Admin,
    Emails,
    Message,
    LiftedUser,
    HiddenCardOverride,
    Attachment,
    AttachmentPref,
    GoogleSlidesId,
    SwapPref,
    RecentlyDeletedMessage,
    Log,
    CpTap,
)


def rows_to_dicts(result):
    return [dict(row) for row in result.mappings().all()]


def get_admin_by_netid(db_session, netid):
    return db_session.execute(
        select(Admin).where(Admin.id == netid).limit(1)
    ).scalar_one_or_none()


def get_user_by_uuid(db_session, user_uuid):
    user = db_session.execute(
        select(
            LiftedUser.id,
            LiftedUser.email,
            LiftedUser.given_name,
            LiftedUser.full_name,
            LiftedUser.affiliation,
            LiftedUser.updated_at,
        )
        .where(LiftedUser.id == user_uuid)
        .limit(1)
    ).mappings().first()

    return dict(user) if user is not None else None


def increment_clicked_quick_link_count(user_uuid, db_session):
    if not user_uuid:
        return False

    result = db_session.execute(
        update(LiftedUser)
        .where(LiftedUser.id == user_uuid)
        .values(clicked_quick_link_count=func.coalesce(LiftedUser.clicked_quick_link_count, 0) + 1)
    )
    db_session.commit()
    return result.rowcount > 0


def _upsert_lifted_user(email, given_name, full_name, affiliation, db_session):
    normalized_email = (email or "").strip().lower()
    now_utc = datetime.now(timezone.utc)

    if not normalized_email:
        return None

    existing_user = db_session.execute(
        select(
            LiftedUser.id,
            LiftedUser.given_name,
            LiftedUser.full_name,
            LiftedUser.affiliation,
        )
        .where(LiftedUser.email == normalized_email)
        .limit(1)
    ).mappings().first()

    resolved_given_name = given_name or (existing_user["given_name"] if existing_user else None)
    resolved_full_name = full_name or (existing_user["full_name"] if existing_user else None)
    resolved_affiliation = affiliation or (existing_user["affiliation"] if existing_user else None)

    if existing_user is not None:
        db_session.execute(
            update(LiftedUser)
            .where(LiftedUser.email == normalized_email)
            .values(
                given_name=resolved_given_name,
                full_name=resolved_full_name,
                affiliation=resolved_affiliation,
                updated_at=now_utc
            )
        )
        user_uuid = existing_user["id"]
    else:
        user_uuid = db_session.execute(
            insert(LiftedUser)
            .values(
                email=normalized_email,
                given_name=resolved_given_name,
                full_name=resolved_full_name,
                affiliation=resolved_affiliation,
                updated_at=now_utc,
            )
            .returning(LiftedUser.id)
        ).scalar_one()

    db_session.commit()
    return {
        "id": user_uuid,
        "email": normalized_email,
        "given_name": resolved_given_name,
        "full_name": resolved_full_name,
        "affiliation": resolved_affiliation,
        "updated_at": now_utc,
    }


def upsert_user_from_oidc(oidc_profile, db_session):
    email = oidc_profile.get("email")
    given_name = oidc_profile.get("given_name")
    full_name = oidc_profile.get("name")
    affiliation = oidc_profile.get("eduPersonPrimaryAffiliation")
    user = _upsert_lifted_user(email, given_name, full_name, affiliation, db_session)
    if user is None:
        return None

    return {
        "email": user["email"],
        "given_name": user["given_name"],
        "full_name": user["full_name"],
        "affiliation": user["affiliation"],
        "updated_at": user["updated_at"],
    }


def upsert_user_by_email(email, given_name, full_name, affiliation, db_session):
    return _upsert_lifted_user(email, given_name, full_name, affiliation, db_session)


def get_lifted_stats(db_session):
    total_received, unique_received, unique_sent = db_session.execute(
        select(
            func.count().label("total_received"),
            func.count(distinct(Message.recipient_email)).label("unique_received"),
            func.count(distinct(Message.sender_email)).label("unique_sent")
        ).select_from(Message)
    ).one()

    return {
        "total_received": int(total_received or 0),
        "unique_received": int(unique_received or 0),
        "unique_sent": int(unique_sent or 0)
    }


def get_messages_payload(db_session, target_email, message_group_filter):
    received_cards = rows_to_dicts(db_session.execute(
        select(Message.id, Message.message_group)
        .where(Message.recipient_email == target_email)
    ))

    sent_cards = rows_to_dicts(db_session.execute(
        select(Message.id, Message.message_group)
        .where(Message.sender_email == target_email)
    ))

    recv_stats = select(
        Message.message_group.label("message_group"),
        Message.recipient_email.label("recipient_email"),
        func.count().label("cnt")
    ).group_by(Message.message_group, Message.recipient_email).subquery()

    recv_ranking = select(
        recv_stats.c.message_group,
        recv_stats.c.recipient_email,
        func.rank().over(
            partition_by=recv_stats.c.message_group,
            order_by=recv_stats.c.cnt.desc()
        ).label("rank")
    ).subquery()

    received_ranks = rows_to_dicts(db_session.execute(
        select(recv_ranking.c.message_group, recv_ranking.c.rank)
        .where(recv_ranking.c.recipient_email == target_email)
    ))

    sent_stats = select(
        Message.message_group.label("message_group"),
        Message.sender_email.label("sender_email"),
        func.count().label("cnt")
    ).group_by(Message.message_group, Message.sender_email).subquery()

    sent_ranking = select(
        sent_stats.c.message_group,
        sent_stats.c.sender_email,
        func.rank().over(
            partition_by=sent_stats.c.message_group,
            order_by=sent_stats.c.cnt.desc()
        ).label("rank")
    ).subquery()

    sent_ranks = rows_to_dicts(db_session.execute(
        select(sent_ranking.c.message_group, sent_ranking.c.rank)
        .where(sent_ranking.c.sender_email == target_email)
    ))

    hidden_card_overrides = db_session.execute(
        select(HiddenCardOverride.message_group)
        .where(HiddenCardOverride.recipient_email == target_email)
    ).scalars().all()

    attachments = rows_to_dicts(db_session.execute(
        select(Attachment.id, Attachment.message_group, Attachment.attachment, Attachment.count)
        .where(Attachment.message_group == message_group_filter)
        .order_by(Attachment.id.desc())
    ))

    attachment_prefs = rows_to_dicts(db_session.execute(
        select(
            AttachmentPref.id,
            AttachmentPref.recipient_email,
            AttachmentPref.message_group,
            AttachmentPref.attachment_id,
            Attachment.attachment
        )
        .join(Attachment, Attachment.id == AttachmentPref.attachment_id)
        .where(AttachmentPref.recipient_email == target_email)
    ))

    return {
        "received_cards": received_cards,
        "sent_cards": sent_cards,
        "received_ranks": received_ranks,
        "sent_ranks": sent_ranks,
        "hidden_card_overrides": hidden_card_overrides,
        "attachments": attachments,
        "attachment_prefs": attachment_prefs,
    }


def get_card_payload(db_session, card_id, lookup_email):
    try:
        card_id_int = int(card_id)
    except (TypeError, ValueError):
        card_id_int = None

    card = None
    if card_id_int is not None:
        card = db_session.execute(
            select(
                Message.id,
                Message.created_timestamp,
                Message.message_group,
                Message.sender_email,
                Message.sender_name,
                Message.recipient_email,
                Message.recipient_name,
                Message.message_content,
                AttachmentPref.attachment_id,
                Attachment.attachment,
            )
            .outerjoin(
                AttachmentPref,
                (Message.recipient_email == AttachmentPref.recipient_email)
                & (Message.message_group == AttachmentPref.message_group),
            )
            .outerjoin(Attachment, AttachmentPref.attachment_id == Attachment.id)
            .where(Message.id == card_id_int)
            .limit(1)
        ).mappings().first()

    overrides = db_session.execute(
        select(HiddenCardOverride.message_group)
        .where(HiddenCardOverride.recipient_email == lookup_email)
    ).scalars().all()

    return {
        "card": dict(card) if card is not None else None,
        "overrides": overrides,
    }


def claim_attachment(row_id, db_session):
    try:
        row_id_int = int(row_id)
    except (TypeError, ValueError):
        return False

    result = db_session.execute(
        update(Attachment)
        .where((Attachment.id == row_id_int) & (Attachment.count > 0))
        .values(count=Attachment.count - 1)
    )
    db_session.commit()
    return result.rowcount > 0


def return_attachment(row_id, db_session):
    try:
        row_id_int = int(row_id)
    except (TypeError, ValueError):
        return False

    result = db_session.execute(
        update(Attachment)
        .where(Attachment.id == row_id_int)
        .values(count=Attachment.count + 1)
    )
    db_session.commit()
    return result.rowcount > 0


def get_cards_with_attachments(message_group, db_session):
    return rows_to_dicts(db_session.execute(
        select(
            Message.id,
            Message.created_timestamp,
            Message.message_group,
            Message.sender_email,
            Message.sender_name,
            Message.recipient_email,
            Message.recipient_name,
            Message.message_content,
            AttachmentPref.attachment_id,
            Attachment.attachment,
        )
        .outerjoin(
            AttachmentPref,
            (Message.recipient_email == AttachmentPref.recipient_email)
            & (Message.message_group == AttachmentPref.message_group),
        )
        .outerjoin(Attachment, AttachmentPref.attachment_id == Attachment.id)
        .where(Message.message_group == message_group)
    ))


def get_attachment_pref(recipient_email, message_group, db_session):
    row = db_session.execute(
        select(
            AttachmentPref.id,
            AttachmentPref.recipient_email,
            AttachmentPref.message_group,
            AttachmentPref.attachment_id,
        )
        .where(
            (AttachmentPref.recipient_email == recipient_email)
            & (AttachmentPref.message_group == message_group)
        )
        .limit(1)
    ).mappings().first()
    return dict(row) if row else None


def get_attachment_pref_by_id(pref_id, db_session):
    try:
        pref_id_int = int(pref_id)
    except (TypeError, ValueError):
        return None

    row = db_session.execute(
        select(
            AttachmentPref.id,
            AttachmentPref.recipient_email,
            AttachmentPref.message_group,
            AttachmentPref.attachment_id,
        ).where(AttachmentPref.id == pref_id_int)
    ).mappings().first()
    return dict(row) if row else None


def create_attachment_pref(recipient_email, message_group, attachment_id, db_session):
    db_session.execute(
        insert(AttachmentPref).values(
            recipient_email=recipient_email,
            message_group=message_group,
            attachment_id=int(attachment_id),
        )
    )
    db_session.commit()


def update_attachment_pref(recipient_email, message_group, attachment_id, db_session):
    result = db_session.execute(
        update(AttachmentPref)
        .where(
            (AttachmentPref.recipient_email == recipient_email)
            & (AttachmentPref.message_group == message_group)
        )
        .values(attachment_id=int(attachment_id))
    )
    db_session.commit()
    return result.rowcount > 0


def delete_attachment_pref_by_id(pref_id, db_session):
    try:
        pref_id_int = int(pref_id)
    except (TypeError, ValueError):
        return False

    result = db_session.execute(
        delete(AttachmentPref).where(AttachmentPref.id == pref_id_int)
    )
    db_session.commit()
    return result.rowcount > 0


def list_attachments_for_message_group(message_group, db_session):
    return rows_to_dicts(db_session.execute(
        select(Attachment.id, Attachment.message_group, Attachment.attachment, Attachment.count)
        .where(Attachment.message_group == message_group)
        .order_by(Attachment.id.desc())
    ))


def delete_attachment_by_id(attachment_id, db_session):
    try:
        attachment_id_int = int(attachment_id)
    except (TypeError, ValueError):
        return False

    result = db_session.execute(
        delete(Attachment).where(Attachment.id == attachment_id_int)
    )
    db_session.commit()
    return result.rowcount > 0


def create_attachment(message_group, attachment, count, db_session):
    db_session.execute(
        insert(Attachment).values(
            message_group=message_group,
            attachment=attachment,
            count=int(count),
        )
    )
    db_session.commit()


def get_google_slides_presentation_id(message_group, db_session):
    return db_session.execute(
        select(GoogleSlidesId.presentation_id)
        .where(GoogleSlidesId.message_group == message_group)
        .limit(1)
    ).scalar_one_or_none()


def upsert_google_slides_id(message_group, presentation_id, db_session):
    existing = db_session.execute(
        select(GoogleSlidesId.id).where(GoogleSlidesId.message_group == message_group).limit(1)
    ).scalar_one_or_none()

    if existing is None:
        db_session.execute(
            insert(GoogleSlidesId).values(
                message_group=message_group,
                presentation_id=presentation_id,
            )
        )
    else:
        db_session.execute(
            update(GoogleSlidesId)
            .where(GoogleSlidesId.message_group == message_group)
            .values(presentation_id=presentation_id)
        )
    db_session.commit()


def update_message_by_id(card_id, values, db_session):
    result = db_session.execute(
        update(Message).where(Message.id == int(card_id)).values(**values)
    )
    db_session.commit()
    return result.rowcount > 0


def delete_message_by_id(card_id, db_session):
    result = db_session.execute(
        delete(Message).where(Message.id == int(card_id))
    )
    db_session.commit()
    return result.rowcount > 0


def insert_recently_deleted_message(card, db_session):
    db_session.execute(
        insert(RecentlyDeletedMessage).values(
            created_timestamp=card["created_timestamp"],
            message_group=card["message_group"],
            sender_email=card["sender_email"],
            sender_name=card.get("sender_name"),
            recipient_email=card["recipient_email"],
            recipient_name=card.get("recipient_name"),
            message_content=card["message_content"],
        )
    )
    db_session.commit()


def get_swap_pref(recipient_email, message_group_from, db_session):
    row = db_session.execute(
        select(
            SwapPref.id,
            SwapPref.recipient_email,
            SwapPref.message_group_from,
            SwapPref.message_group_to,
        )
        .where(
            (SwapPref.recipient_email == recipient_email)
            & (SwapPref.message_group_from == message_group_from)
        )
        .limit(1)
    ).mappings().first()
    return dict(row) if row else None


def list_swap_prefs(db_session):
    return rows_to_dicts(db_session.execute(
        select(
            SwapPref.id,
            SwapPref.recipient_email,
            SwapPref.message_group_from,
            SwapPref.message_group_to,
            SwapPref.event,
        )
    ))


def create_swap_pref(recipient_email, message_group_from, message_group_to, db_session):
    # Derive event from message_group_from by removing trailing _e or _p
    event = message_group_from.rsplit('_', 1)[0]
    
    updated_rows = db_session.execute(
        update(SwapPref)
        .where(
            (SwapPref.recipient_email == recipient_email)
            & (SwapPref.event == event)
        )
        .values(
            message_group_from=message_group_from,
            message_group_to=message_group_to,
            event=event,
        )
    ).rowcount

    if updated_rows == 0:
        db_session.execute(
            insert(SwapPref).values(
                recipient_email=recipient_email,
                message_group_from=message_group_from,
                message_group_to=message_group_to,
                event=event,
            )
        )

    db_session.commit()


def delete_swap_pref_by_id(pref_id, db_session):
    result = db_session.execute(delete(SwapPref).where(SwapPref.id == int(pref_id)))
    db_session.commit()
    return result.rowcount > 0


def insert_message(values, db_session):
    db_session.execute(insert(Message).values(**values))
    db_session.commit()


def update_messages_group_for_recipient(recipient_email, swap_from, swap_to, db_session):
    result = db_session.execute(
        update(Message)
        .where((Message.message_group == swap_from) & (Message.recipient_email == recipient_email))
        .values(message_group=swap_to)
    )
    db_session.commit()
    return result.rowcount


def browse_messages(message_group, query, db_session):
    stmt = select(
        Message.id,
        Message.created_timestamp,
        Message.message_group,
        Message.sender_email,
        Message.sender_name,
        Message.recipient_email,
        Message.recipient_name,
        Message.message_content,
    ).order_by(Message.created_timestamp.desc())

    if message_group != "all":
        stmt = stmt.where(Message.message_group == message_group)

    if query:
        like_value = f"%{query}%"
        stmt = stmt.where(
            or_(Message.recipient_email.ilike(like_value), Message.sender_email.ilike(like_value))
        )

    return rows_to_dicts(db_session.execute(stmt))


def list_logs_desc(db_session):
    return rows_to_dicts(db_session.execute(
        select(
            Log.id,
            Log.log_timestamp,
            Log.user_email,
            Log.user_name,
            Log.log_type,
            Log.error_code,
            Log.log_content,
        ).order_by(Log.id.desc())
    ))


def list_recently_deleted_messages_desc(db_session):
    return rows_to_dicts(db_session.execute(
        select(
            RecentlyDeletedMessage.id,
            RecentlyDeletedMessage.created_timestamp,
            RecentlyDeletedMessage.deleted_timestamp,
            RecentlyDeletedMessage.message_group,
            RecentlyDeletedMessage.sender_email,
            RecentlyDeletedMessage.sender_name,
            RecentlyDeletedMessage.recipient_email,
            RecentlyDeletedMessage.recipient_name,
            RecentlyDeletedMessage.message_content,
        ).order_by(RecentlyDeletedMessage.id.desc())
    ))


def insert_log(user_email, user_name, log_type, error_code, log_content, db_session):
    db_session.execute(
        insert(Log).values(
            user_email=user_email,
            user_name=user_name,
            log_type=log_type,
            error_code=error_code,
            log_content=log_content,
        )
    )
    db_session.commit()


def record_email_open(email_open_id, db_session):
    if email_open_id is None:
        return None

    try:
        email_open_id_int = int(email_open_id)
    except (TypeError, ValueError):
        return None

    existing_open = db_session.execute(
        select(
            Emails.id,
            Emails.open_count,
        )
        .where(Emails.id == email_open_id_int)
        .limit(1)
    ).mappings().first()

    if existing_open is None:
        return None

    open_count = int(existing_open["open_count"] or 0) + 1

    db_session.execute(
        update(Emails)
        .where(Emails.id == existing_open["id"])
        .values(open_count=open_count)
    )

    db_session.commit()
    return {
        "id": email_open_id_int,
        "open_count": open_count,
    }


def create_email_open_record(to_email, subject, db_session):
    normalized_email = (to_email or "").strip().lower()
    normalized_subject = (subject or "").strip()

    if not normalized_email or not normalized_subject:
        return None

    inserted_open = db_session.execute(
        insert(Emails)
        .values(
            created_at=datetime.now(timezone.utc),
            to_email=normalized_email,
            subject=normalized_subject,
            open_count=0,
        )
        .returning(Emails.id)
    ).scalar_one()
    db_session.commit()

    return {
        "id": int(inserted_open),
        "to_email": normalized_email,
        "subject": normalized_subject,
    }


def list_admins(db_session):
    return rows_to_dicts(db_session.execute(
        select(Admin.id, Admin.write)
    ))


def add_admin(netid, write_perm, db_session):
    db_session.execute(insert(Admin).values(id=netid, write=bool(write_perm)))
    db_session.commit()


def delete_admin(netid, db_session):
    result = db_session.execute(delete(Admin).where(Admin.id == netid))
    db_session.commit()
    return result.rowcount > 0


def list_hidden_card_overrides_desc(db_session):
    return rows_to_dicts(db_session.execute(
        select(
            HiddenCardOverride.id,
            HiddenCardOverride.recipient_email,
            HiddenCardOverride.message_group,
        ).order_by(HiddenCardOverride.id.desc())
    ))


def add_hidden_card_override(recipient_email, message_group, db_session):
    db_session.execute(
        insert(HiddenCardOverride).values(
            recipient_email=recipient_email,
            message_group=message_group,
        )
    )
    db_session.commit()


def delete_hidden_card_override(override_id, db_session):
    result = db_session.execute(
        delete(HiddenCardOverride).where(HiddenCardOverride.id == int(override_id))
    )
    db_session.commit()
    return result.rowcount > 0


def get_cp_tap_by_netid(netid, db_session):
    row = db_session.execute(
        select(
            CpTap.netid,
            CpTap.responded_timestamp,
            CpTap.tap_name,
            CpTap.accept_tap,
            CpTap.clear_schedule,
            CpTap.wear_clothing,
            CpTap.monitor_inbox,
            CpTap.notes,
            CpTap.pronouns,
            CpTap.phonetic_spelling,
            CpTap.allergens,
            CpTap.physical_accommodations,
        ).where(CpTap.netid == netid)
    ).mappings().first()
    return dict(row) if row else None


def list_cp_taps(db_session):
    return rows_to_dicts(db_session.execute(
        select(
            CpTap.netid,
            CpTap.responded_timestamp,
            CpTap.tap_name,
            CpTap.accept_tap,
            CpTap.clear_schedule,
            CpTap.wear_clothing,
            CpTap.monitor_inbox,
            CpTap.notes,
            CpTap.pronouns,
            CpTap.phonetic_spelling,
            CpTap.allergens,
            CpTap.physical_accommodations,
        )
    ))


def update_cp_tap_response(netid, values, db_session):
    result = db_session.execute(
        update(CpTap).where(CpTap.netid == netid).values(**values)
    )
    db_session.commit()
    return result.rowcount > 0


def add_cp_tap(netid, tap_name, db_session):
    db_session.execute(insert(CpTap).values(netid=netid, tap_name=tap_name))
    db_session.commit()


def delete_cp_tap(netid, db_session):
    result = db_session.execute(delete(CpTap).where(CpTap.netid == netid))
    db_session.commit()
    return result.rowcount > 0


def get_attachment_prefs_with_attachment(message_group, db_session):
    return rows_to_dicts(db_session.execute(
        select(
            AttachmentPref.id,
            AttachmentPref.recipient_email,
            AttachmentPref.message_group,
            AttachmentPref.attachment_id,
            Attachment.attachment,
        )
        .join(Attachment, Attachment.id == AttachmentPref.attachment_id)
        .where(AttachmentPref.message_group == message_group)
    ))


def get_analytics_payload(semester_param, db_session):
    analytics_sql = text("""
with base_messages as (
        select * from lifted.messages
        where
            case
                when :semester_param = 'all' then true
                else message_group in (:semester_param || '_p', :semester_param || '_e')
            end
    ),
    counts as (
        select
            count(*) as total,
            count(*) filter (where message_group like '%_p') as physical,
            count(*) filter (where message_group like '%_e') as elifted,
            count(distinct recipient_email) as unique_recipients,
            count(distinct sender_email) as unique_senders
        from base_messages
    ),
    senders as (
        select replace(sender_email, '@cornell.edu', '') as name, count(*) as count
        from base_messages group by sender_email order by count desc limit 5
    ),
    receivers as (
        select replace(recipient_email, '@cornell.edu', '') as name, count(*) as count
        from base_messages group by recipient_email order by count desc limit 5
    ),
    participation as (
        select replace(email, '@cornell.edu', '') as name, count(distinct semester) as count
        from (
            select sender_email as email, replace(replace(message_group, '_p', ''), '_e', '') as semester from base_messages
            union
            select recipient_email as email, replace(replace(message_group, '_p', ''), '_e', '') as semester from base_messages
        ) sub group by email order by count desc limit 5
    ),
    msg_stats as (
        select
            coalesce(message_content, '') as message,
            case
                when nullif(trim(coalesce(message_content, '')), '') is null then 0
                else array_length(regexp_split_to_array(trim(coalesce(message_content, '')), '\\s+'), 1)
            end as word_count
        from base_messages
        order by word_count asc
    ),
    word_cloud as (
        with raw_words as (
            select unnest(regexp_split_to_array(lower(message_content), '[^a-z]+')) as word
            from base_messages
        )
        select json_build_array(word, count(*)) as item
        from raw_words
        where length(word) > 2
        and word not in (
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as',
            'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
            'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each',
            'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
            'same', 'so', 'than', 'too', 'very', 's', 't', 'just', 'don', 'now', 'your', 'my', 'me', 'am',
            're', 've', 'll', 'm', 'd'
        )
        group by word
        order by count(*) desc
        limit 50
    ),
    timeline_data as (
        select
            case
                when :semester_param = 'all' then replace(replace(message_group, '_p', ''), '_e', '')
                else cast(date(created_timestamp) as text)
            end as time_value,
            count(*) as count_val,
            count(*) filter (where message_group like '%_p') as physical,
            count(*) filter (where message_group like '%_e') as elifted,
            min(created_timestamp) as sort_key
        from base_messages
        group by 1
        order by sort_key asc
    ),
    swaps as (
         select
             coalesce(
                 (select count(distinct recipient_email) from lifted.swap_prefs
                    where case when :semester_param = 'all' then true else message_group_from in (:semester_param || '_p', :semester_param || '_e') end),
                 0
             ) as total_swaps,

             coalesce(
                 (select json_agg(t) from (
                        select a.attachment as name, count(*) as count
                        from lifted.attachment_prefs ap
                        join lifted.attachments a on ap.attachment_id = a.id
                        where case when :semester_param = 'all' then true else ap.message_group in (:semester_param || '_p', :semester_param || '_e') end
                        group by a.attachment order by count desc
                 ) t),
                 '[]'::json
             ) as attachments
    ),
    avail_sems as (
        select
             sem as value,
             concat(
                 case split_part(sem, '_', 1)
                     when 'sp' then 'Spring' when 'fa' then 'Fall' when 'su' then 'Summer' when 'wi' then 'Winter'
                     else upper(split_part(sem, '_', 1))
                 end,
                 ' 20',
                 split_part(sem, '_', 2)
             ) as label
        from (
            select distinct replace(replace(message_group, '_p', ''), '_e', '') as sem
            from lifted.messages
            where message_group like '%\\_%'
        ) sub
        order by split_part(sem, '_', 2)::int desc,
                         (case when split_part(sem, '_', 1) = 'fa' then 0 else 1 end) asc
    )
    select json_build_object(
        'cards_breakdown', (select json_build_object('total', total, 'physical', physical, 'elifted', elifted) from counts),
        'unique_recipients', (select unique_recipients from counts),
        'unique_senders', (select unique_senders from counts),
        'leaderboards', json_build_object(
            'sending', (select coalesce(json_agg(s), '[]') from senders s),
            'receiving', (select coalesce(json_agg(r), '[]') from receivers r),
            'participation', case when :semester_param = 'all' then (select coalesce(json_agg(p), '[]') from participation p) else '[]'::json end
        ),
        'message_stats', json_build_object(
            'shortest', (select row_to_json(m) from msg_stats m limit 1),
            'longest', (select row_to_json(m) from msg_stats m order by word_count desc nulls last limit 1),
            'avg_words', (select round(avg(word_count), 1) from msg_stats)
        ),
        'common_words', (select coalesce(json_agg(item), '[]') from word_cloud),
        'timeline', (
            select coalesce(json_agg(
                json_build_object(
                    case when :semester_param = 'all' then 'semester' else 'date' end, time_value,
                    'count', count_val,
                    'total', count_val,
                    'physical', physical,
                    'elifted', elifted
                )
            ), '[]') from timeline_data
        ),
        'swap_stats', (select row_to_json(s) from swaps s),
        'available_semesters', (select coalesce(json_agg(a), '[]') from avail_sems a),
        'is_all_time', (:semester_param = 'all')
    )
""")

    result = db_session.execute(analytics_sql, {"semester_param": semester_param}).scalar_one()
    if isinstance(result, str):
        return json.loads(result)
    return result
