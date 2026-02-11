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
    
    init() {
        let api = APIClient()
        let authService = AuthService()
        
        _environment = StateObject(
            wrappedValue: AppEnvironment(api: api, authService: authService)
        )
    }
    
    var body: some Scene {
        WindowGroup {
            MainTabView()
                .environmentObject(environment)
                .task {
                    await environment.getStatus()
                    await environment.getConfig()
                }
        }
    }
}
