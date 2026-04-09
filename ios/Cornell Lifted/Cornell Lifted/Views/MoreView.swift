//
//  MoreView.swift
//  Cornell Lifted
//
//  Created by Reid Fleishman on 1/5/26.
//

import SwiftUI

struct MoreView: View {
    @EnvironmentObject var environment: AppEnvironment
    
    var body: some View {
        NavigationStack {
            List {
                if environment.status?.authenticated == true {
                    Section {
                        Button(role: .destructive) {
                            environment.logout()
                        } label: {
                            Label("Logout", systemImage: "rectangle.portrait.and.arrow.right")
                        }
                    }
                } else {
                    Section {
                        Text("Please sign in from the Send or View Messages tabs to access more features.")
                            .font(.tenorSans(size: 14))
                            .foregroundColor(.gray)
                    }
                }
            }
            .navigationTitle("More")
        }
    }
}

#Preview {
    MoreView()
        .environmentObject(AppEnvironment(api: APIClient(), authService: AuthService()))
}
