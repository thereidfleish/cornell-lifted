//
//  SwapCardsView.swift
//  Cornell Lifted
//

import SwiftUI

struct SwapCardsView: View {
    @EnvironmentObject var environment: AppEnvironment
    @EnvironmentObject var viewModel: MessagesViewModel
    let swapText: String
    @State private var loading = false
    @State private var statusMsg: String?
    @State private var showConfirm = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Can't make it on the last day of classes?")
                .font(.tenorSans(size: 18))
                .fontWeight(.bold)
            
            Text(swapText.replacingOccurrences(of: "<[^>]+>", with: "", options: .regularExpression))
                .font(.tenorSans(size: 14))
                .foregroundColor(.gray)
            
            if let statusMsg = statusMsg {
                Text(statusMsg)
                    .font(.tenorSans(size: 14))
                    .foregroundColor(.green)
                    .padding(.vertical, 5)
            }
            
            Button(action: {
                showConfirm = true
            }) {
                Text(loading ? "Swapping..." : "Swap My Cards to eLifted")
                    .font(.tenorSans(size: 16))
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.cornellBlue)
                    .cornerRadius(10)
            }
            .disabled(loading)
            .alert("Confirm Swap", isPresented: $showConfirm) {
                Button("Cancel", role: .cancel) { }
                Button("Confirm", role: .none) {
                    swapCards()
                }
            } message: {
                Text("Even if you're not sure you'll make it on the last day of classes, we strongly recommend choosing this option - otherwise, if you don't pick up your physical cards, you won't be able to view them virtually.\n\nYou'll receive your cards as a PDF that you can print out!")
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(15)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
    
    private func swapCards() {
        loading = true
        statusMsg = nil
        Task {
            do {
                let swapped = try await viewModel.swapMessages()
                await MainActor.run {
                    if swapped {
                        statusMsg = "Cards swapped successfully!"
                    } else {
                        statusMsg = "Error swapping cards. Please try again or contact support."
                    }
                    loading = false
                }
            } catch {
                await MainActor.run {
                    statusMsg = "Error swapping cards."
                    loading = false
                }
            }
        }
    }
}
