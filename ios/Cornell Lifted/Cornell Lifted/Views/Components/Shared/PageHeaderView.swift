//
//  PageHeaderView.swift
//  Cornell Lifted
//
//  Created by Reid Fleishman on 1/5/26.
//

import SwiftUI

struct PageHeaderView: View {
    let title: String?
    let description: String
    let user: User?
    var actionButton: ActionButton? = nil
    
    struct ActionButton {
        let title: String
        let action: () -> Void
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            if let title = title {
                Text(title)
                    .font(.schoolbell(size: 32))
                    .fontWeight(.bold)
                    .foregroundColor(.cornellRed)
                    .frame(maxWidth: .infinity, alignment: .center)
            }
            
            Text(description)
                .multilineTextAlignment(.center)
                .font(.tenorSans(size: 18))
                .frame(maxWidth: .infinity)
                .padding(.bottom, 10)
            
            if let user = user {
                HStack {
                    VStack(alignment: .leading) {
                        Text("Welcome, \(user.name.split(separator: " ")[0])!")
                            .font(.schoolbell(size: 25))
                            .foregroundStyle(.cornellRed)
                        
                        Text(user.email)
                            .font(.tenorSans(size: 15))
                    }
                    
                    if let actionButton = actionButton {
                        Spacer()
                        
                        Button {
                            actionButton.action()
                        } label: {
                            Text(actionButton.title)
                                .font(.tenorSans(size: 16))
                                .fontWeight(.bold)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.cornellRed)
                    } else {
                        Spacer()
                    }
                }
                .frame(maxWidth: .infinity)
            }
        }
    }
}

#Preview {
    VStack(spacing: 30) {
        PageHeaderView(
            title: "Send a Message",
            description: "Share gratitude and appreciation with someone special",
            user: nil
        )
        
        Divider()
        
        PageHeaderView(
            title: nil,
            description: "Explore the gratitude you've shared and received throughout your Cornell experience",
            user: User(admin_write_perm: false, email: "ezra@cornell.edu", id: "1", is_admin: false, name: "Ezra Cornell"),
            actionButton: .init(title: "Send a Message") {}
        )
    }
    .padding()
}
