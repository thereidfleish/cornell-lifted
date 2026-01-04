//
//  LiftedMessage.swift
//  Cornell Lifted
//
//  Created by Reid Fleishman on 1/4/26.
//

import Foundation

struct LiftedMessage: Identifiable, Codable {
    let id: Int
    let created_timestamp: Date
    let message_group: String
    let sender_email: String
    let sender_name: String
    let recipient_email: String
    let recipient_name: String
    let message_content: String
}
