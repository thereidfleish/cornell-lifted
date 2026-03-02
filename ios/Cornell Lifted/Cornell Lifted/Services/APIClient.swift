//
//  APIClient.swift
//  Cornell Lifted
//
//  Created by Reid Fleishman on 1/4/26.
//

import Foundation

final class APIClient {
    let url = "https://api.cornelllifted.com/api"
    
    func getStatus() async throws -> Status {
        let url = URL(string: "\(url)/auth/status")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder()
            .decode(Status.self, from: data)
    }
    
    func getConfig() async throws -> Config {
        let url = URL(string: "\(url)/config")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder()
            .decode(Config.self, from: data)
    }
    
    func getMessages() async throws -> [Messages] {
        let url = URL(string: "\(url)/messages")!
        let (data, _) = try await URLSession.shared.data(from: url)
        

        if let json = try? JSONSerialization.jsonObject(with: data, options: .mutableContainers),
           let jsonData = try? JSONSerialization.data(withJSONObject: json, options: .prettyPrinted) {
            print(String(decoding: jsonData, as: UTF8.self))
        } else {
            print("json data malformed")
        }

        return try JSONDecoder()
            .decode([Messages].self, from: data)
    }

    func getCard(id: Int) async throws -> CardData {
        let url = URL(string: "\(self.url)/get-card-json/\(id)")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(CardData.self, from: data)
    }

    func deleteMessage(id: Int) async throws -> StatusResponse {
        let url = URL(string: "\(self.url)/delete-message/\(id)")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(StatusResponse.self, from: data)
    }

    func swapMessages() async throws -> StatusResponse {
        let url = URL(string: "\(self.url)/swap-messages")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(StatusResponse.self, from: data)
    }

    func getAttachments(messageGroup: String) async throws -> [Attachment] {
        let url = URL(string: "\(self.url)/get-attachments/\(messageGroup)")!
        let (data, _) = try await URLSession.shared.data(from: url)
        let response = try JSONDecoder().decode(AttachmentsResponse.self, from: data)
        return response.attachments
    }

    func getAttachmentPref(messageGroup: String) async throws -> AttachmentPref? {
        let url = URL(string: "\(self.url)/get-attachment-pref/\(messageGroup)")!
        let (data, _) = try await URLSession.shared.data(from: url)
        let response = try JSONDecoder().decode(AttachmentPrefResponse.self, from: data)
        return response.attachment_pref
    }

    func setAttachmentPref(id: Int) async throws -> StatusResponse {
        let url = URL(string: "\(self.url)/set-attachment-pref")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.httpBody = "id=\(id)".data(using: .utf8)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(StatusResponse.self, from: data)
    }

    func deleteAttachmentPref(id: Int) async throws -> StatusResponse {
        let url = URL(string: "\(self.url)/delete-attachment-pref/\(id)")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(StatusResponse.self, from: data)
    }

    func getCardPdf(id: Int) async throws -> Data {
        let url = URL(string: "\(self.url)/get-card-pdf/\(id)")!
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw NSError(domain: "APIClient", code: 0, userInfo: [NSLocalizedDescriptionKey: "Failed to download PDF"])
        }
        
        return data
    }
}
