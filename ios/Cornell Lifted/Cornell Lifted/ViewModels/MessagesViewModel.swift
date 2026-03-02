//
//  MessagesViewModel.swift
//  Cornell Lifted
//
//  Created by Reid Fleishman on 1/4/26.
//

import Foundation
import Combine

final class MessagesViewModel: ObservableObject {
    @Published var messages: [Messages]?
    @Published var isLoading = false
    @Published var error: String?
    
    private let api: APIClient
    
    init(api: APIClient) {
        self.api = api
    }
    
    func getMessages() async {
        isLoading = true
        error = nil
        
        do {
            messages = try await api.getMessages()
        } catch {
            print(error)
            self.error = "Failed to load messages. Please check your connection."
        }
        
        isLoading = false
    }

    // Modal API Calls
    func getCard(id: Int) async throws -> CardData {
        return try await api.getCard(id: id)
    }

    func deleteMessage(id: Int) async throws -> Bool {
        let response = try await api.deleteMessage(id: id)
        if response.deleted == true {
            await getMessages() // Refresh the list
            return true
        }
        return false
    }

    func getCardPdf(id: Int) async throws -> Data {
        return try await api.getCardPdf(id: id)
    }

    // Attachment API Calls
    func getAttachments(messageGroup: String) async throws -> [Attachment] {
        return try await api.getAttachments(messageGroup: messageGroup)
    }

    func getAttachmentPref(messageGroup: String) async throws -> AttachmentPref? {
        return try await api.getAttachmentPref(messageGroup: messageGroup)
    }

    func setAttachmentPref(id: Int) async throws -> StatusResponse {
        return try await api.setAttachmentPref(id: id)
    }

    func deleteAttachmentPref(id: Int) async throws -> StatusResponse {
        return try await api.deleteAttachmentPref(id: id)
    }

    // Swap API Calls
    func swapMessages() async throws -> Bool {
        let response = try await api.swapMessages()
        if response.swapped == true {
            await getMessages() // Refresh the list
            return true
        }
        return false
    }
}
