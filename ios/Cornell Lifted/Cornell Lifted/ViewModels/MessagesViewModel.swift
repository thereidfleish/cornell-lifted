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
    
    private let api = APIClient()
    
    func getMessages() async {
        isLoading = true
        
        do {
            messages = try await api.getMessages()
        } catch {
            print(error)
        }
        
        isLoading = false
    }
}
