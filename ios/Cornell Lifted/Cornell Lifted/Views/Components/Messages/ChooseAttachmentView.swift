//
//  ChooseAttachmentView.swift
//  Cornell Lifted
//

import SwiftUI

struct ChooseAttachmentView: View {
    @EnvironmentObject var environment: AppEnvironment
    @EnvironmentObject var viewModel: MessagesViewModel
    let messageGroup: String
    @State private var attachments: [Attachment] = []
    @State private var chosenPref: AttachmentPref?
    @State private var loading = true
    @State private var statusMsg: String?
    @State private var error: String?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Choose Your Card Attachment!")
                .font(.tenorSans(size: 18))
                .fontWeight(.bold)
            
            Text(LocalizedStringKey("You'll receive this alongside your cards! If you only want your cards, leave this blank. Hard deadline to select an attachment is **Sunday 4/27/25 at 11:59 PM!**"))
                .font(.tenorSans(size: 14))
                .foregroundColor(.gray)
            
            if let statusMsg = statusMsg {
                Text(statusMsg)
                    .font(.tenorSans(size: 14))
                    .foregroundColor(.green)
                    .padding(.vertical, 5)
            }
            
            if loading {
                LoadingView()
                    .frame(height: 100)
            } else if let error = error {
                ErrorView(error: error) {
                    loadData()
                }
                .frame(height: 100)
            } else {
                if let chosen = chosenPref {
                    HStack {
                        Text("Current Attachment: ")
                            .font(.tenorSans(size: 14))
                        Text(attachments.first(where: { $0.id == chosen.attachment_id })?.attachment ?? "Unknown")
                            .font(.tenorSans(size: 14))
                            .fontWeight(.bold)
                        
                        Spacer()
                        
                        Button("Clear") {
                            deletePref(id: chosen.id)
                        }
                        .font(.tenorSans(size: 12))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(5)
                    }
                    .padding(.bottom, 5)
                } else {
                    Text("No attachment chosen yet.")
                        .font(.tenorSans(size: 14))
                        .foregroundColor(.gray)
                        .padding(.bottom, 5)
                }
                
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                    ForEach(attachments) { att in
                        Button(action: {
                            setPref(id: att.id)
                        }) {
                            VStack(alignment: .leading) {
                                Text(att.attachment)
                                    .font(.tenorSans(size: 16))
                                    .fontWeight(.bold)
                                Text("Available: \(att.count)")
                                    .font(.tenorSans(size: 12))
                            }
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(chosenPref?.attachment_id == att.id ? Color.cornellBlue.opacity(0.1) : Color.white)
                            .cornerRadius(10)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(chosenPref?.attachment_id == att.id ? Color.cornellBlue : Color.gray.opacity(0.2), lineWidth: 1)
                            )
                        }
                        .disabled(att.count < 1)
                        .opacity(att.count < 1 ? 0.5 : 1.0)
                        .foregroundColor(chosenPref?.attachment_id == att.id ? Color.cornellBlue : .primary)
                    }
                }
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(15)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
        .onAppear {
            loadData()
        }
    }
    
    private func loadData() {
        loading = true
        error = nil
        Task {
            do {
                let fetchedAttachments = try await viewModel.getAttachments(messageGroup: messageGroup)
                let fetchedPref = try await viewModel.getAttachmentPref(messageGroup: messageGroup)
                await MainActor.run {
                    self.attachments = fetchedAttachments
                    self.chosenPref = fetchedPref
                    self.loading = false
                }
            } catch {
                await MainActor.run {
                    self.error = "Failed to load attachments."
                    self.loading = false
                }
            }
        }
    }
    
    private func setPref(id: Int) {
        loading = true
        Task {
            do {
                let response = try await viewModel.setAttachmentPref(id: id)
                await MainActor.run {
                    if response.status == "success" {
                        statusMsg = "Attachment chosen!"
                        loadData()
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                            statusMsg = nil
                        }
                    } else {
                        statusMsg = response.status ?? "Error choosing attachment."
                        loading = false
                    }
                }
            } catch {
                await MainActor.run {
                    statusMsg = "Error choosing attachment."
                    loading = false
                }
            }
        }
    }
    
    private func deletePref(id: Int) {
        loading = true
        Task {
            do {
                let response = try await viewModel.deleteAttachmentPref(id: id)
                await MainActor.run {
                    if response.status == "success" {
                        statusMsg = "Attachment cleared!"
                        loadData()
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                            statusMsg = nil
                        }
                    } else {
                        statusMsg = response.status ?? "Error clearing attachment."
                        loading = false
                    }
                }
            } catch {
                await MainActor.run {
                    statusMsg = "Error clearing attachment."
                    loading = false
                }
            }
        }
    }
}
