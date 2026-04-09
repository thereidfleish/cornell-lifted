//
//  AuthService.swift
//  Cornell Lifted
//
//  Created by Reid Fleishman on 1/4/26.
//

import Foundation
import AuthenticationServices

final class AuthService: NSObject {
    // MARK: - Cookie Persistence
    /// Persist cookies for the cornelllifted.com domain so auth survives app restarts.
    static func persistCookies() {
        guard let cookies = HTTPCookieStorage.shared.cookies else { return }
        let relevant = cookies.filter { $0.domain.contains("cornelllifted.com") }
        let cookieData: [Data] = relevant.compactMap { try? NSKeyedArchiver.archivedData(withRootObject: $0, requiringSecureCoding: false) }
        UserDefaults.standard.set(cookieData, forKey: "SavedCookies_cornelllifted")
        UserDefaults.standard.synchronize()
    }

    /// Restore previously saved cookies into the shared cookie storage.
    static func restoreCookies() {
        guard let cookieDatas = UserDefaults.standard.array(forKey: "SavedCookies_cornelllifted") as? [Data] else { return }
        for data in cookieDatas {
            if let cookie = try? NSKeyedUnarchiver.unarchiveTopLevelObjectWithData(data) as? HTTPCookie {
                HTTPCookieStorage.shared.setCookie(cookie)
            }
        }
    }

    private var authSession: ASWebAuthenticationSession?
    
    enum AuthError: Error {
        case cancelled
        case invalidResponse
        case serverError(String)
    }
    
    func login() async throws {
        let loginURL = URL(string: "https://api.cornelllifted.com/login?next=lifted://auth/callback")!

        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            self.authSession = ASWebAuthenticationSession(
                url: loginURL,
                callbackURLScheme: "lifted"
            ) { callbackURL, error in
                if let error = error as? ASWebAuthenticationSessionError, error.code == .canceledLogin {
                    continuation.resume(throwing: AuthError.cancelled)
                    return
                } else if let error {
                    continuation.resume(throwing: error)
                    return
                }
               
                guard let url = callbackURL,
                      let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
                      let ticket = components.queryItems?.first(where: { $0.name == "ticket" })?.value else {
                    continuation.resume(throwing: AuthError.invalidResponse)
                    return
                }
               
                // Claim the ticket to establish session
                Task {
                    do {
                        var req = URLRequest(url: URL(string: "https://api.cornelllifted.com/api/auth/claim-ticket")!)
                        req.httpMethod = "POST"
                        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
                        req.httpBody = try JSONEncoder().encode(["ticket": ticket])
                       
                        let (data, response) = try await URLSession.shared.data(for: req)
                        if let http = response as? HTTPURLResponse {
                            if (200..<300).contains(http.statusCode) {
                                AuthService.persistCookies()
                                continuation.resume(returning: ())
                            } else {
                                let body = String(data: data, encoding: .utf8) ?? "<no body>"
                                continuation.resume(throwing: AuthError.serverError(body))
                            }
                        }
                    } catch {
                        continuation.resume(throwing: error)
                    }
                }
            }
           
            self.authSession?.presentationContextProvider = self
            _ = self.authSession?.start()
        }
    }
}

extension AuthService: ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        UIApplication.shared.windows.first!
    }
}
