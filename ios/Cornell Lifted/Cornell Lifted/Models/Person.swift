//
//  Person.swift
//  Cornell Lifted
//

import Foundation

struct Person: Codable, Identifiable, Hashable {
    var id: String { NetID }
    let NetID: String
    let Name: String
    let PrimaryAffiliation: String
    let College: String
    let PrimaryDept: String
    let PrimaryTitle: String
    
    enum CodingKeys: String, CodingKey {
        case NetID
        case Name
        case PrimaryAffiliation = "Primary Affiliation"
        case College
        case PrimaryDept = "Primary Dept"
        case PrimaryTitle = "Primary Title"
    }
}

struct PeopleSearchResponse: Codable {
    let results: [Person]
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        // Handle "results": "none" case
        if let resultsArray = try? container.decode([Person].self, forKey: .results) {
            self.results = resultsArray
        } else {
            self.results = []
        }
    }
    
    enum CodingKeys: String, CodingKey {
        case results
    }
}

struct MessageConfirmationResponse: Codable {
    let message_confirmation: Bool
    let recipient_email: String?
    let error: String?
}
