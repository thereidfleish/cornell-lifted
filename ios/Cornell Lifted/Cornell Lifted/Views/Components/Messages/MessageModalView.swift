//
//  MessageModalView.swift
//  Cornell Lifted
//

import SwiftUI

struct MessageModalView: View {
    @EnvironmentObject var environment: AppEnvironment
    @EnvironmentObject var viewModel: MessagesViewModel
    let cardId: Int
    let overrideHiddenMessage: Bool
    @Environment(\.dismiss) var dismiss
    @State private var card: CardData?
    @State private var loading = true
    @State private var error: String?
    @State private var showDeleteConfirm = false
    @State private var deleting = false
    @State private var loadingPdf = false
    @State private var pdfUrl: URL?
    @State private var showPDFViewer = false
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color.white.ignoresSafeArea()
                
                if loading {
                    ProgressView()
                } else if let error = error {
                    VStack {
                        Text(error)
                            .foregroundColor(.red)
                            .multilineTextAlignment(.center)
                            .padding()
                        Button("Close") {
                            dismiss()
                        }
                    }
                } else if let card = card {
                    ScrollView {
                        VStack(spacing: 20) {
                            Text("Your Lifted Message")
                                .font(.tenorSans(size: 24))
                                .fontWeight(.bold)
                                .foregroundColor(.cornellBlue)
                            
                            VStack(spacing: 5) {
                                Text("To: \(card.recipient_name)")
                                    .font(.tenorSans(size: 18))
                                Text("(\(card.recipient_email.split(separator: "@").first ?? ""))")
                                    .font(.tenorSans(size: 14))
                                    .foregroundColor(.gray)
                            }
                            
                            VStack(alignment: .leading) {
                                Text(card.message_content)
                                    .font(.tenorSans(size: 18))
                                    .lineSpacing(5)
                                    .padding()
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(Color.cornellBlue.opacity(0.1))
                                    .cornerRadius(15)
                            }
                            .padding(.horizontal)
                            
                            Text("From: \(card.sender_name)")
                                .font(.tenorSans(size: 18))
                            
                            if let attachment = card.attachment {
                                Text(LocalizedStringKey("The recipient chose to receive a **\(attachment)** alongside this message"))
                                    .font(.tenorSans(size: 14))
                                    .multilineTextAlignment(.center)
                                    .padding(.horizontal)
                            }
                            
                            Text("Message written at \(card.created_timestamp)")
                                .font(.tenorSans(size: 12))
                                .foregroundColor(.gray)
                            
                            // Edit/Delete options
                            if let user = environment.status?.user,
                               let config = environment.config,
                               user.email == card.sender_email && card.message_group == config.form_message_group {
                                
                                Button(action: {
                                    showDeleteConfirm = true
                                }) {
                                    Text(deleting ? "Deleting..." : "Delete Message")
                                        .font(.tenorSans(size: 16))
                                        .fontWeight(.bold)
                                        .foregroundColor(.white)
                                        .padding()
                                        .frame(maxWidth: .infinity)
                                        .background(Color.cornellRed)
                                        .cornerRadius(10)
                                }
                                .padding(.horizontal)
                                .padding(.top, 20)
                                .disabled(deleting)
                                .alert("Are you sure?", isPresented: $showDeleteConfirm) {
                                    Button("Cancel", role: .cancel) { }
                                    Button("Delete", role: .destructive) {
                                        deleteMessage()
                                    }
                                } message: {
                                    Text("This action cannot be undone.")
                                }
                            }
                            
                            if let config = environment.config, !config.hidden_cards.contains(card.message_group) || overrideHiddenMessage {
                                VStack(spacing: 10) {
                                    Text("Want to print your card?")
                                        .font(.tenorSans(size: 16))
                                        .fontWeight(.semibold)
                                        .foregroundColor(.cornellBlue)
                                    
                                    Text("Either print with 100% size on normal paper and cut it out, or insert a properly sized card into your printer!")
                                        .font(.tenorSans(size: 12))
                                        .foregroundColor(.gray)
                                        .multilineTextAlignment(.center)
                                    
                                    Button(action: {
                                        viewPdf()
                                    }) {
                                        Text(loadingPdf ? "Converting PDF..." : "View PDF")
                                            .font(.tenorSans(size: 16))
                                            .fontWeight(.bold)
                                            .foregroundColor(.white)
                                            .padding()
                                            .frame(maxWidth: .infinity)
                                            .background(Color.cornellBlue)
                                            .cornerRadius(10)
                                    }
                                    .disabled(loadingPdf || deleting)
                                }
                                .padding()
                                .background(Color.cornellBlue.opacity(0.05))
                                .cornerRadius(15)
                                .padding(.horizontal)
                            }
                        }
                        .padding(.vertical)
                    }
                }
            }
            .navigationBarItems(trailing: Button(action: {
                dismiss()
            }) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundColor(.gray)
                    .font(.title2)
            })
            .fullScreenCover(isPresented: $showPDFViewer) {
                if let url = pdfUrl {
                    PDFPreviewView(url: url)
                }
            }
            .onAppear {
                loadCard()
            }
        }
    }
    
    private func loadCard() {
        loading = true
        Task {
            do {
                let fetchedCard = try await viewModel.getCard(id: cardId)
                await MainActor.run {
                    self.card = fetchedCard
                    self.loading = false
                }
            } catch {
                await MainActor.run {
                    self.error = "Error loading message. Please try again later."
                    self.loading = false
                }
            }
        }
    }

    private func viewPdf() {
        loadingPdf = true
        Task {
            do {
                let data = try await viewModel.getCardPdf(id: cardId)
                let tempFolder = FileManager.default.temporaryDirectory
                let fileURL = tempFolder.appendingPathComponent("LiftedMessage-\(cardId).pdf")
                try data.write(to: fileURL)
                
                await MainActor.run {
                    self.pdfUrl = fileURL
                    self.showPDFViewer = true
                    self.loadingPdf = false
                }
            } catch {
                await MainActor.run {
                    self.loadingPdf = false
                    // Optionally show an error alert
                }
            }
        }
    }
    
    private func deleteMessage() {
        deleting = true
        Task {
            do {
                let deleted = try await viewModel.deleteMessage(id: cardId)
                await MainActor.run {
                    if deleted {
                        dismiss()
                    }
                    deleting = false
                }
            } catch {
                await MainActor.run {
                    deleting = false
                }
            }
        }
    }
}
