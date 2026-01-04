//
//  AuthViewModel.swift
//  Cornell Lifted
//
//  Created by Reid Fleishman on 1/4/26.
//

import Foundation
import Combine

//@MainActor
//final class AuthViewModel: ObservableObject {
//    @Published var isAuthenticated = false
//    @Published var isLoading = false
//
//    private let authService: AuthService
//    private let api: APIClient
//
//    init(authService: AuthService, api: APIClient) {
//        self.authService = authService
//        self.api = api
//    }
//
//    func checkAuthStatus() async {
//        do {
//            isAuthenticated = try await api.checkAuthStatus()
//        } catch {
//            isAuthenticated = false
//        }
//    }
//
//    func login() async {
//        isLoading = true
//        defer { isLoading = false }
//
//        do {
//            try await authService.login()
//            await checkAuthStatus()
//        } catch {
//            print(error)
//        }
//    }
//}
