//
//  Cornell_LiftedApp.swift
//  Cornell Lifted
//
//  Created by Reid Fleishman on 1/3/26.
//

import SwiftUI

@main
struct Cornell_LiftedApp: App {
    @StateObject private var environment: AppEnvironment
    @StateObject private var messagesViewModel: MessagesViewModel
    
    init() {
        let api = APIClient()
        let authService = AuthService()
        
        // Restore persisted cookies early so authenticated requests can reuse the session
        AuthService.restoreCookies()
        
        let env = AppEnvironment(api: api, authService: authService)
        _environment = StateObject(wrappedValue: env)
        _messagesViewModel = StateObject(wrappedValue: MessagesViewModel(api: api))
    }
    
    var body: some Scene {
        WindowGroup {
            MainTabView()
                .environmentObject(environment)
                .environmentObject(messagesViewModel)
                .task {
                    await environment.getStatus()
                    await environment.getConfig()
                }
        }
    }
}

