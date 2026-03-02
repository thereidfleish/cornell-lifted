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
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading) {
                    Text("Explore the gratitude you've shared and received throughout your Cornell experience")
                        .multilineTextAlignment(.center)
                        .font(.tenorSans(size: 18))
                        .padding(.bottom, 10)
                    
                    if let user = environment.status?.user {
                        // Logged In State
                        HStack {
                            VStack(alignment: .leading) {
                                Text("Welcome, \(user.name.split(separator: " ")[0])!")
                                    .font(.schoolbell(size: 25))
                                    .foregroundStyle(.cornellRed)
                                
                                Text(user.email)
                                    .font(.tenorSans(size: 15))
                            }
                            
                            Spacer()
                            
                            Button("Send a Message") {
                                // Action
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.cornellRed)
                        }
                        .frame(maxWidth: .infinity)
                        
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
                        VStack(spacing: 20) {
                            Text("🔑")
                                .font(.system(size: 50))
                            
                            Text("Sign In to View Your Messages")
                                .font(.tenorSans(size: 20))
                                .fontWeight(.bold)
                            
                            Text("Sign in with your Cornell NetID to view and manage Lifted messages you've sent and received!")
                                .font(.tenorSans(size: 16))
                                .multilineTextAlignment(.center)
                                .foregroundColor(.gray)
                            
                            Button("Sign in with NetID") {
                                Task {
                                    do {
                                        try await environment.login()
                                        await environment.getStatus()
                                        await viewModel.getMessages()
                                    } catch {
                                        print(error)
                                    }
                                }
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.cornellRed)
                            .controlSize(.large)
                        }
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color.white)
                        .cornerRadius(20)
                        .shadow(color: .black.opacity(0.05), radius: 10)
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

//#Preview {
//    MessagesView()
//}
