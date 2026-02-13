//
//  MessagesView.swift
//  Cornell Lifted
//
//  Created by Reid Fleishman on 1/3/26.
//

import SwiftUI

struct MessagesView: View {
    @EnvironmentObject var environment: AppEnvironment
    @StateObject var viewModel: MessagesViewModel
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading) {
                    Text("Explore the gratitude you've shared and received throughout your Cornell experience")
                        .multilineTextAlignment(.center)
                        .font(.custom("TenorSans", size: 18))
                    
                    if let user = environment.status?.user {
                        HStack {
                            VStack(alignment: .leading) {
                                Text("Welcome, \(user.name.split(separator: " ")[0])!")
                                    .font(.custom("Schoolbell-Regular", size: 25))
                                    .foregroundStyle(.red)
                                
                                Text(user.email)
                                    .font(.custom("TenorSans", size: 15))
                            }
                            
                            Spacer()
                            
                            Button("Send a Message") {
                                Task {
                                    do {
                                        
                                    } catch {
                                    }
                                }
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.red)
                        }
                        .frame(maxWidth: .infinity)
                        
                        
                        Text("Your Lifted Timeline")
                            .font(.custom("Schoolbell-Regular", size: 25))
                        
                        if let messages = viewModel.messages {
                            ForEach(messages, id: \.event) { event in
                                Text(verbatim: "\(event.season_name) \(event.year_name) Lifted")
                                    .font(.custom("Schoolbell-Regular", size: 25))
                                    .foregroundStyle(.blue)
                            }
                        } else {
                            Text("Loading...")
                        }
                        
//                        Text(verbatim: "\(viewModel.messages)")
                        
                        
                    } else {
                        Button("Sign in with NetID") {
                            Task {
                                do {
                                    try await environment.login()
                                    await environment.getStatus()
                                } catch {
                                    print(error)
                                }
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.red)
                    }
                }
                
                
                //                Text("Status: \(environment.status)")
                
                
            }
            .padding()
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("Your Lifted Journey")
                        .font(.custom("Schoolbell-Regular", size: 30)) // Apply your custom font here
                        .foregroundStyle(.red) // You can also change color
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .task {
                await viewModel.getMessages()
            }
        }
    }
}

//#Preview {
//    MessagesView()
//}
