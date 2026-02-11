//
//  Messages.swift
//  Cornell Lifted
//
//  Created by Reid Fleishman on 1/4/26.
//

import Foundation

struct Messages: Codable {
    let season: String
    let season_name: String
    let types: [MessagesTypes]
    let year: Int
    let year_name: Int
}

struct MessagesTypes: Codable {
    let chosen_attachment: MessagesChosenAttachment
    let hide_cards: Bool
    let message_group: String
    let received_card_ids: [Int]
    let received_count: Int
    let received_rank: Int
    let sent_card_ids: [Int]
    let sent_count: Int
    let sent_rank: Int
    let type: String
    let type_name: String
}

struct MessagesChosenAttachment: Codable, Identifiable {
    let id: Int
    let attachment_name: String
}
