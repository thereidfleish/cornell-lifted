//
//  Color+Extensions.swift
//  Cornell Lifted
//

import SwiftUI

extension Color {
    static let cornellRed = Color(red: 179/255, green: 27/255, blue: 27/255)
    static let cornellBlue = Color(red: 0/255, green: 118/255, blue: 189/255)
}

extension ShapeStyle where Self == Color {
    static var cornellRed: Color { .cornellRed }
    static var cornellBlue: Color { .cornellBlue }
}
