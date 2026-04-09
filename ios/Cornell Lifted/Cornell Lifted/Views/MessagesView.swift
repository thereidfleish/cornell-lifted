//
//  MessagesView.swift
//  Cornell Lifted
//
//  Created by Reid Fleishman on 1/3/26.
//

import SwiftUI

struct MessagesView: View {
    @EnvironmentObject var environment: AppEnvironment
    @EnvironmentObject var viewModel: MessagesViewModel
    @Binding var selectedTab: Int
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading) {
                    PageHeaderView(
                        title: nil,
                        description: "Explore the gratitude you've shared and received throughout your Cornell experience",
                        user: environment.status?.user,
                        actionButton: .init(title: "Send a Message") {
                            selectedTab = 1
                        }
                    )
                    
                    if let user = environment.status?.user {
                        // Logged In State
                        if viewModel.isLoading {
                            LoadingView()
                                .padding(.top, 40)
                        } else if let error = viewModel.error {
                            ErrorView(error: error) {
                                Task {
                                    await viewModel.getMessages()
                                }
                            }
                            .padding(.top, 40)
                        } else if let messages = viewModel.messages {
                            ForEach(Array(messages.enumerated()), id: \.offset) { i, event in
                                VStack(alignment: .leading, spacing: 10) {
                                    Text(verbatim: "\(event.season_name) \(event.year_name)")
                                        .font(.schoolbell(size: 28))
                                        .foregroundStyle(.cornellBlue)
                                    
                                    ForEach(event.types, id: \.type) { type in
                                        SentReceivedCardView(type: type, season: event.season_name, year: event.year_name, isLatestPhysical: i == 0 && type.type == "p")
                                            .environmentObject(environment)
                                            .environmentObject(viewModel)
                                    }
                                }
                                .padding(.vertical)
                            }
                        } else {
                            // Case where we have a user but messages haven't been fetched yet
                            LoadingView()
                                .padding(.top, 40)
                                .onAppear {
                                    Task { await viewModel.getMessages() }
                                }
                        }
                    } else if environment.status == nil {
                        // Initial loading of auth status
                        LoadingView()
                            .padding(.top, 40)
                    } else {
                        // Not Logged In
                        AuthPromptView(
                            title: "Sign In to View Your Messages",
                            description: "Sign in with your Cornell NetID to view and manage Lifted messages you've sent and received!",
                            loginAction: {
                                await environment.login()
                                await viewModel.getMessages()
                            }
                        )
                        .padding(.top, 20)
                    }
                }
            }
            .padding()
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("Your Lifted Journey")
                        .font(.schoolbell(size: 30))
                        .foregroundStyle(.cornellRed)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .task {
                // Initial fetch when tab is tapped
                if environment.status?.user != nil {
                    await viewModel.getMessages()
                }
            }
            .onChange(of: environment.status?.user?.id) { _ in
                // Re-fetch if user login status changes
                if environment.status?.user != nil {
                    Task {
                        await viewModel.getMessages()
                    }
                }
            }
        }
    }
}
