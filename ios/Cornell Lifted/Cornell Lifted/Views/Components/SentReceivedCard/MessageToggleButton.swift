//
//  MessageToggleButton.swift
//  Cornell Lifted
//

import SwiftUI

struct MessageToggleButton: View {
    let title: String
    let count: Int
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Text(title)
                Text("\(count)")
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(isSelected ? Color.white : Color.gray.opacity(0.1))
                    .foregroundColor(isSelected ? .cornellBlue : .black)
                    .clipShape(Capsule())
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(isSelected ? Color.cornellBlue : Color.clear)
            .clipShape(Capsule())
        }
        .foregroundColor(isSelected ? .white : .black)
        .font(.tenorSans(size: 16))
    }
}
