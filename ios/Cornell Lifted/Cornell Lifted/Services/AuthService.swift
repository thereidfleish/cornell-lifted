//
//  AuthService.swift
//  Cornell Lifted
//
//  Created by Reid Fleishman on 1/4/26.
//

import Foundation
import AuthenticationServices

final class AuthService: NSObject {
    private var authSession: ASWebAuthenticationSession?

    func login() async throws {
        let loginURL = URL(
            string: "https://api.cornelllifted.com/login?next=lifted://auth/callback"
        )!

        authSession = ASWebAuthenticationSession(
            url: loginURL,
            callbackURLScheme: "lifted"
        ) { callbackURL, error in
            if let error {
                print("Auth error:", error)
                return
            }
            print(callbackURL)
            
            

            // We don't need data from callbackURL
            // Cookie is already set
        }

        authSession?.presentationContextProvider = self
        authSession?.start()
        
        if let cookies = HTTPCookieStorage.shared.cookies {
            print("Cookies:", cookies)
        }
    }
}

extension AuthService: ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(
        for session: ASWebAuthenticationSession
    ) -> ASPresentationAnchor {
        UIApplication.shared.windows.first!
    }
}
