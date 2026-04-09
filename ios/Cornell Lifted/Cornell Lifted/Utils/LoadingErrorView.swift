//
//  LoadingErrorView.swift
//  Cornell Lifted
//

import SwiftUI

struct LoadingView: View {
    var body: some View {
        ProgressView()
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct ErrorView: View {
    let error: String
    let retryAction: (() -> Void)?
    
    var body: some View {
        VStack(spacing: 15) {
            Text(error)
                .foregroundColor(.cornellRed)
                .multilineTextAlignment(.center)
                .font(.tenorSans(size: 16))
            
            if let retryAction = retryAction {
                Button(action: retryAction) {
                    Text("Retry")
                        .font(.tenorSans(size: 16))
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 10)
                        .background(Color.cornellBlue)
                        .cornerRadius(10)
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct HTMLText: View {
    let html: String
    var fontSize: CGFloat = 16
    var colorHex: String = "#374151"

    var body: some View {
        HTMLView(html: html, fontSize: fontSize, colorHex: colorHex)
    }
}

struct HTMLView: UIViewRepresentable {
    let html: String
    var fontSize: CGFloat
    var colorHex: String

    func makeUIView(context: Context) -> UITextView {
        let textView = UITextView()
        textView.isEditable = false
        textView.isScrollEnabled = false
        textView.isSelectable = true
        textView.dataDetectorTypes = .link
        textView.backgroundColor = .clear
        textView.textContainerInset = .zero
        textView.textContainer.lineFragmentPadding = 0
        textView.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        textView.setContentCompressionResistancePriority(.required, for: .vertical)
        textView.linkTextAttributes = [
            .foregroundColor: UIColor(red: 179/255, green: 27/255, blue: 27/255, alpha: 1.0),
            .underlineStyle: NSUnderlineStyle.single.rawValue
        ]
        return textView
    }

    func updateUIView(_ uiView: UITextView, context: Context) {
        // Prevent redundant updates and infinite loops
        if uiView.accessibilityIdentifier == html { return }
        uiView.accessibilityIdentifier = html

        let cleanedHtml = html
            .replacingOccurrences(of: "<p style='margin: 0px'><br></p>", with: "")
            .replacingOccurrences(of: "<p style=\"margin: 0px\"><br></p>", with: "")
            .replacingOccurrences(of: "<p><br></p>", with: "")
            .replacingOccurrences(of: " style='margin: 0px'", with: "")
            .replacingOccurrences(of: " style=\"margin: 0px\"", with: "")

        let styledHtml = """
        <style>
        :root {
            font-family: 'TenorSans', -apple-system, sans-serif;
            font-size: \(Int(fontSize))px;
            color: \(colorHex);
        }
        p {
            margin-bottom: 16px;
            margin-top: 0px;
        }
        p:last-child {
            margin-bottom: 0px;
        }
        b, strong { 
            font-family: -apple-system, sans-serif;
            font-weight: bold; 
        }
        i, em { 
            font-family: -apple-system, sans-serif;
            font-style: italic; 
        }
        .ql-font-schoolbell { 
            font-family: 'Schoolbell-Regular', cursive; 
        }
        </style>
        \(cleanedHtml)
        """
        
        guard let data = styledHtml.data(using: .utf8) else { return }
        
        // HTML parsing must be on the main thread
        DispatchQueue.main.async {
            if let attributedString = try? NSMutableAttributedString(
                data: data,
                options: [
                    .documentType: NSAttributedString.DocumentType.html,
                    .characterEncoding: String.Encoding.utf8.rawValue
                ],
                documentAttributes: nil
            ) {
                // The HTML parser often appends an extra newline at the end of the text.
                while attributedString.string.hasSuffix("\n") || attributedString.string.hasSuffix(" ") || attributedString.string.hasSuffix("\r") {
                    attributedString.deleteCharacters(in: NSRange(location: attributedString.length - 1, length: 1))
                }
                
                // --- FAUX BOLD & FAUX ITALIC MAGIC ---
                let fullRange = NSRange(location: 0, length: attributedString.length)
                
                attributedString.enumerateAttribute(.font, in: fullRange, options: []) { value, range, stop in
                    if let font = value as? UIFont {
                        let fontName = font.fontName.lowercased()
                        let isBold = font.fontDescriptor.symbolicTraits.contains(.traitBold) || fontName.contains("bold")
                        let isItalic = font.fontDescriptor.symbolicTraits.contains(.traitItalic) || fontName.contains("italic") || fontName.contains("oblique")
                        
                        // We also need to check if the HTML parsing just wrapped it in a standard attribute
                        var htmlBold = false
                        var htmlItalic = false
                        
                        // Check for standard CoreText attributes that might indicate bold/italic if the font missed it
                        if let strokeWidth = attributedString.attribute(.strokeWidth, at: range.location, effectiveRange: nil) as? NSNumber, strokeWidth.floatValue < 0 {
                            htmlBold = true
                        }
                        if let obliqueness = attributedString.attribute(.obliqueness, at: range.location, effectiveRange: nil) as? NSNumber, obliqueness.floatValue > 0 {
                            htmlItalic = true
                        }

                        let finalBold = isBold || htmlBold
                        let finalItalic = isItalic || htmlItalic
                        let family = font.familyName
                        
                        if finalBold || finalItalic || family != "Tenor Sans" {
                            if let customFont = UIFont(name: "TenorSans", size: font.pointSize) {
                                // If italic, apply a matrix transformation to the font itself
                                var finalFont = customFont
                                if finalItalic {
                                    // Use a standard 12 degree slant for a natural italic look
                                    let matrix = CGAffineTransform(1, 0, CGFloat(tan(12.0 * .pi / 180.0)), 1, 0, 0)
                                    let desc = customFont.fontDescriptor.withMatrix(matrix)
                                    finalFont = UIFont(descriptor: desc, size: customFont.pointSize)
                                }
                                
                                attributedString.addAttribute(.font, value: finalFont, range: range)
                                
                                if finalBold {
                                    // Standard bold thickness
                                    attributedString.addAttribute(.strokeWidth, value: -3.0, range: range)
                                    if let fgColor = attributedString.attribute(.foregroundColor, at: range.location, effectiveRange: nil) {
                                        attributedString.addAttribute(.strokeColor, value: fgColor, range: range)
                                    }
                                }
                            }
                        }
                    }
                }
                
                uiView.attributedText = attributedString
            }
        }
    }

    func sizeThatFits(_ proposal: ProposedViewSize, uiView: UITextView, context: Context) -> CGSize? {
        let width = proposal.width ?? UIView.layoutFittingExpandedSize.width
        let targetSize = CGSize(width: width, height: UIView.layoutFittingExpandedSize.height)
        let height = uiView.sizeThatFits(targetSize).height
        return CGSize(width: width, height: height)
    }
}
