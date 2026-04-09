//
//  FormClosedView.swift
//  Cornell Lifted
//
//  Created by Reid Fleishman on 1/5/26.
//

import SwiftUI

struct FormClosedView: View {
    let onViewMessages: () -> Void
    
    var body: some View {
        VStack(spacing: 25) {
            Text("The message form isn't open right now")
                .font(.tenorSans(size: 24))
                .fontWeight(.bold)
                .foregroundColor(.cornellRed)
                .multilineTextAlignment(.center)
            
            Text("You can't send a Lifted message at this time. Please check back later!")
                .font(.tenorSans(size: 16))
                .multilineTextAlignment(.center)
                .foregroundColor(.gray)
            
            VStack(spacing: 12) {
                Link(destination: URL(string: "https://cornelllifted.com/faqs")!) {
                    Text("View FAQs")
                        .font(.tenorSans(size: 16))
                        .fontWeight(.bold)
                        .padding(.vertical, 10)
                        .padding(.horizontal, 25)
                        .background(Color.cornellBlue)
                        .foregroundColor(.white)
                        .cornerRadius(25)
                }
                
                Button(action: onViewMessages) {
                    Text("View Your Sent Messages")
                        .font(.tenorSans(size: 16))
                        .fontWeight(.bold)
                        .padding(.vertical, 10)
                        .padding(.horizontal, 25)
                        .background(Color.gray.opacity(0.1))
                        .foregroundColor(.cornellBlue)
                        .cornerRadius(25)
                }
            }
        }
        .padding(30)
        .frame(maxWidth: .infinity)
        .background(Color.white)
        .cornerRadius(20)
        .shadow(color: .black.opacity(0.05), radius: 10)
    }
}

#Preview {
    ZStack {
        Color.gray.opacity(0.1).ignoresSafeArea()
        FormClosedView(onViewMessages: {})
            .padding()
    }
}
