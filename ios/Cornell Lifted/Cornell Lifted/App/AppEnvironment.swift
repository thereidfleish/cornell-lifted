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
    
    let api: APIClient
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
}
