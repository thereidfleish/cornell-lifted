//
//  MainTabView.swift
//  Cornell Lifted
//
//  Created by Reid Fleishman on 1/3/26.
//

import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var environment: AppEnvironment
    @EnvironmentObject var viewModel: MessagesViewModel
    @State private var selectedTab = 0
    
    var body: some View {
        ZStack {
            Color.cornellBlue.ignoresSafeArea() // Global background
            
            TabView(selection: $selectedTab) {
                HomeView()
                    .tabItem { Label("Home", systemImage: "balloon.fill") }
                    .tag(0)

                SendMessageView(selectedTab: $selectedTab)
                    .tabItem { Label("Send Message", systemImage: "paperplane.fill") }
                    .tag(1)
                
                MessagesView(selectedTab: $selectedTab)
                    .tabItem { Label("View Messages", systemImage: "tray.fill") }
                    .tag(2)
                
                MoreView()
                    .tabItem { Label("More", systemImage: "ellipsis.circle.fill") }
                    .tag(3)
            }
        }
    }
}

#Preview {
    MainTabView()
}
