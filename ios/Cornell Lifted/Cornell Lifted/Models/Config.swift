//
//  Config.swift
//  Cornell Lifted
//
//  Created by Reid Fleishman on 1/4/26.
//

import Foundation

struct Config: Codable {
    let theme: String
    let message_group_list_map: [String:String]
    let hidden_cards: [String]
    let form_message_group: String
    let attachment_message_group: String
    let swap_from: String
    let swap_to: String
    let swap_text: String
    let coming_soon_text: String
}
