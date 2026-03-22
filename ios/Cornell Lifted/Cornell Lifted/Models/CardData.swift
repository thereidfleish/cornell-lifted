//
//  CardData.swift
//  Cornell Lifted
//

import Foundation

struct CardData: Codable, Identifiable {
    let id: Int
    let recipient_name: String
    let recipient_email: String
    let sender_name: String
    let sender_email: String
    let message_content: String
    let message_group: String
    let created_timestamp: String
    let attachment: String?
}

struct Attachment: Codable, Identifiable {
    let id: Int
    let attachment: String
    let count: Int
}

struct AttachmentPref: Codable {
    let attachment_id: Int
    let id: Int
    let message_group: String
    let recipient_email: String
}

struct AttachmentsResponse: Codable {
    let attachments: [Attachment]
}

struct AttachmentPrefResponse: Codable {
    let attachment_pref: AttachmentPref?
}

struct StatusResponse: Codable {
    let status: String?
    let swapped: Bool?
    let deleted: Bool?
}
