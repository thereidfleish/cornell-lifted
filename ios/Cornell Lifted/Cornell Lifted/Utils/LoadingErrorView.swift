//
//  LoadingErrorView.swift
//  Cornell Lifted
//

import SwiftUI

struct LoadingView: View {
    var body: some View {
        ProgressView()
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct ErrorView: View {
    let error: String
    let retryAction: (() -> Void)?
    
    var body: some View {
        VStack(spacing: 15) {
            Text(error)
                .foregroundColor(.red)
                .multilineTextAlignment(.center)
                .font(.tenorSans(size: 16))
            
            if let retryAction = retryAction {
                Button(action: retryAction) {
                    Text("Retry")
                        .font(.tenorSans(size: 16))
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 10)
                        .background(Color.cornellBlue)
                        .cornerRadius(10)
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
