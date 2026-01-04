//
//  MessagesView.swift
//  Cornell Lifted
//
//  Created by Reid Fleishman on 1/3/26.
//

import SwiftUI

struct MessagesView: View {
    @EnvironmentObject var environment: AppEnvironment
    
    var body: some View {
        NavigationStack {
            ScrollView {
                Text("Explore the gratitude you've shared and received throughout your Cornell experience")
                    .multilineTextAlignment(.center)
                    .font(.custom("TenorSans", size: 20))
                
                Text("Hi \(environment.status?.user?.name)")
                
                Text("Status: \(environment.status)")
                
                Button("Sign in with Cornell") {
                    Task {
                        do {
                            try await environment.login()
                            await environment.getStatus()
//                            await environment.loginCompleted()
                        } catch {
                            print(error)
                        }
                    }
                }
                .buttonStyle(.borderedProminent)
                
                
            }
            .padding()
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("Your Lifted Journey")
                        .font(.custom("Schoolbell-Regular", size: 30)) // Apply your custom font here
                        .foregroundColor(.red) // You can also change color
                }
            }
        }
        
        
    }
}

#Preview {
    MessagesView()
}
