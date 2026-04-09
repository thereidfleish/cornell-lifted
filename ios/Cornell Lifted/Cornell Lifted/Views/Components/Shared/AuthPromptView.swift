//
//  AuthPromptView.swift
//  Cornell Lifted
//
//  Created by Reid Fleishman on 1/5/26.
//

import SwiftUI

struct AuthPromptView: View {
    let title: String
    let description: String
    let loginAction: () async -> Void
    
    var body: some View {
        VStack(spacing: 20) {
            Text("🔑")
                .font(.system(size: 50))
            
            Text(title)
                .font(.tenorSans(size: 20))
                .fontWeight(.bold)
            
            Text(description)
                .font(.tenorSans(size: 16))
                .multilineTextAlignment(.center)
                .foregroundColor(.gray)
            
            Button {
                Task {
                    await loginAction()
                }
            } label: {
                Text("Sign in with NetID")
                    .font(.tenorSans(size: 18))
                    .fontWeight(.bold)
            }
            .buttonStyle(.borderedProminent)
            .tint(.cornellRed)
            .controlSize(.large)
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color.white)
        .cornerRadius(20)
        .shadow(color: .black.opacity(0.05), radius: 10)
    }
}

#Preview {
    ZStack {
        Color.gray.opacity(0.1).ignoresSafeArea()
        AuthPromptView(
            title: "Sign In to View Your Messages",
            description: "Sign in with your Cornell NetID to view and manage Lifted messages you've sent and received!",
            loginAction: {
                print("Login tapped")
            }
        )
        .padding()
    }
}
