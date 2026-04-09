import Foundation
import CoreGraphics
import CoreText

let fontPaths = [
    "ios/Cornell Lifted/Cornell Lifted/Fonts/Schoolbell-Regular.ttf",
    "ios/Cornell Lifted/Cornell Lifted/Fonts/TenorSans-Regular.ttf"
]

for path in fontPaths {
    guard let provider = CGDataProvider(filename: path),
          let font = CGFont(provider) else {
        print("Failed to load \(path)")
        continue
    }
    if let postScriptName = font.postScriptName {
        print("PostScript name for \(path): \(postScriptName)")
    }
}
