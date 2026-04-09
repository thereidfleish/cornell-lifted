//
//  APIClient.swift
//  Cornell Lifted
//
//  Created by Reid Fleishman on 1/4/26.
//

import Foundation

final class APIClient {
    private let baseURL = "https://api.cornelllifted.com/api"
    
    // MARK: - Generic Helpers
    
    private func fetch<T: Decodable>(_ endpoint: String) async throws -> T {
        let url = URL(string: "\(baseURL)\(endpoint)")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(T.self, from: data)
    }
    
    private func post<T: Decodable>(_ endpoint: String) async throws -> T {
        let url = URL(string: "\(baseURL)\(endpoint)")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(T.self, from: data)
    }

    private func post<T: Decodable, U: Encodable>(_ endpoint: String, body: U) async throws -> T {
        let url = URL(string: "\(baseURL)\(endpoint)")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(T.self, from: data)
    }
    
    private func postString<T: Decodable>(_ endpoint: String, body: String) async throws -> T {
        let url = URL(string: "\(baseURL)\(endpoint)")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.httpBody = body.data(using: .utf8)
        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(T.self, from: data)
    }

    // MARK: - API Methods
    
    func getStatus() async throws -> Status {
        return try await fetch("/auth/status")
    }
    
    func getConfig() async throws -> Config {
        return try await fetch("/config")
    }
    
    func getMessages() async throws -> [Messages] {
        return try await fetch("/messages")
    }

    func getCard(id: Int) async throws -> CardData {
        return try await fetch("/get-card-json/\(id)")
    }

    func deleteMessage(id: Int) async throws -> StatusResponse {
        return try await post("/delete-message/\(id)")
    }

    func swapMessages() async throws -> StatusResponse {
        return try await post("/swap-messages")
    }

    func getAttachments(messageGroup: String) async throws -> [Attachment] {
        let response: AttachmentsResponse = try await fetch("/get-attachments/\(messageGroup)")
        return response.attachments
    }

    func getAttachmentPref(messageGroup: String) async throws -> AttachmentPref? {
        let response: AttachmentPrefResponse = try await fetch("/get-attachment-pref/\(messageGroup)")
        return response.attachment_pref
    }

    func setAttachmentPref(id: Int) async throws -> StatusResponse {
        return try await postString("/set-attachment-pref", body: "id=\(id)")
    }

    func deleteAttachmentPref(id: Int) async throws -> StatusResponse {
        return try await fetch("/delete-attachment-pref/\(id)")
    }

    func getCardPdf(id: Int) async throws -> Data {
        let url = URL(string: "\(baseURL)/get-card-pdf/\(id)")!
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw NSError(domain: "APIClient", code: 0, userInfo: [NSLocalizedDescriptionKey: "Failed to download PDF"])
        }
        return data
    }

    func getFormDescription() async throws -> String {
        let url = URL(string: "\(baseURL)/get-form-description")!
        let (data, _) = try await URLSession.shared.data(from: url)
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        return json?["form_description"] as? String ?? ""
    }

    func peopleSearch(query: String, expanded: Bool = false) async throws -> [Person] {
        var components = URLComponents(string: "\(baseURL)/people-search")!
        components.queryItems = [URLQueryItem(name: "q", value: query)]
        if expanded {
            components.queryItems?.append(URLQueryItem(name: "expand_search", value: "true"))
        }
        
        let (data, _) = try await URLSession.shared.data(from: components.url!)
        let response = try JSONDecoder().decode(PeopleSearchResponse.self, from: data)
        return response.results
    }

    func getEasterEgg(netID: String) async throws -> String {
        let url = URL(string: "\(baseURL)/easter-egg/\(netID)")!
        let (data, _) = try await URLSession.shared.data(from: url)
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        return json?["result"] as? String ?? ""
    }

    func sendMessage(senderName: String, recipientName: String, recipientNetID: String, messageContent: String) async throws -> MessageConfirmationResponse {
        let payload: [String: String] = [
            "sender_name": senderName,
            "recipient_name": recipientName,
            "recipient_netid": recipientNetID,
            "message_content": messageContent
        ]
        return try await post("/send-message", body: payload)
    }
}
