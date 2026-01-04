//
//  AppEnvironment.swift
//  Cornell Lifted
//
//  Created by Reid Fleishman on 1/4/26.
//

import Foundation
import Combine

@MainActor
final class AppEnvironment: ObservableObject {
    @Published var status: Status?
    @Published var config: Config?
    
    private let api: APIClient
    private let authService: AuthService
    
    init(api: APIClient, authService: AuthService) {
        self.api = api
        self.authService = authService
    }
    
    func getStatus() async {
        do {
            status = try await api.getStatus()
            print(status)
        } catch {
            print("getting status failed:", error)
            status = nil
        }
    }
    
    func getConfig() async {
        do {
            config = try await api.getConfig()
        } catch {
            print("getting config failed:", error)
            config = nil
        }
    }
    
    func login() async {
        do {
            try await authService.login()
            await getStatus()
        } catch {
            print("login failed:", error)
        }
    }
    
    //    func bootstrap() async {
    //        do {
    //            let isAuthed = try await authService.checkAuthStatus()
    //            appState = isAuthed ? .authenticated : .unauthenticated
    //        } catch {
    //            appState = .unauthenticated
    //        }
    //    }
    //
    //    func loginCompleted() async {
    //        await bootstrap()
    //    }
    //
    //    func logout() async {
    //        await authService.logout()
    //        appState = .unauthenticated
    //    }
}
