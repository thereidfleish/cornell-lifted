//
//  MessageEmojiButton.swift
//  Cornell Lifted
//

import SwiftUI

struct MessageEmojiButton: View {
    let index: Int
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            ZStack(alignment: .topTrailing) {
                Text("💌")
                    .font(.system(size: 28))
                    .padding(12)
                    .frame(maxWidth: .infinity)
                    .aspectRatio(1, contentMode: .fit)
                    .background(Color.white)
                    .cornerRadius(10)
                    .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
                
                Text("\(index + 1)")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundColor(.white)
                    .frame(width: 18, height: 18)
                    .background(Color.cornellRed)
                    .clipShape(Circle())
                    .offset(x: 4, y: -4)
            }
        }
    }
}
