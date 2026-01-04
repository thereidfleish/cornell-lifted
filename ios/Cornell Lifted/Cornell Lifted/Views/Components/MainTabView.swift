//
//  MainTabView.swift
//  Cornell Lifted
//
//  Created by Reid Fleishman on 1/3/26.
//

import SwiftUI

struct MainTabView: View {
    var body: some View {
        ZStack {
            Color.blue.ignoresSafeArea() // Global background
            
            TabView {
                HomeView()
                    .tabItem { Label("Home", systemImage: "balloon.fill") }

                SendMessageView()
                    .tabItem { Label("Send Message", systemImage: "paperplane.fill") }
                
                MessagesView()
                    .tabItem { Label("View Messages", systemImage: "tray.fill") }
            }
        }
    }
}

#Preview {
    MainTabView()
}
