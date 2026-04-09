//
//  SendMessageView.swift
//  Cornell Lifted
//
//  Created by Reid Fleishman on 1/3/26.
//

import SwiftUI

struct SendMessageView: View {
    @EnvironmentObject var environment: AppEnvironment
    @EnvironmentObject var messagesViewModel: MessagesViewModel
    @Binding var selectedTab: Int
    
    @State private var senderName = ""
    @State private var recipientName = ""
    @State private var selectedPerson: Person?
    @State private var messageContent = ""
    
    @State private var isLoadingForm = true
    @State private var formDescription = ""
    @State private var isSubmitting = false
    @State private var formErrors: [String] = []
    
    @State private var showSuccessDialog = false
    @State private var showErrorDialog = false
    @State private var errorMessage = ""
    @State private var confirmedRecipientEmail = ""
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    PageHeaderView(
                        title: nil,
                        description: "Share gratitude and appreciation with someone special",
                        user: nil
                    )
                    .padding(.top, 20)
                    
                    if let config = environment.config, config.form_message_group == "none" {
                        FormClosedView(onViewMessages: {
                            selectedTab = 2
                        })
                        .padding(.top, 20)
                    } else if let user = environment.status?.user {
                        VStack(alignment: .leading, spacing: 20) {
                            // Form Description
                            if !formDescription.isEmpty {
                                HTMLText(html: formDescription)
                                    .padding()
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(Color.white)
                                    .cornerRadius(15)
                                    .shadow(color: .black.opacity(0.05), radius: 5)
                            }
                            
                            VStack(alignment: .leading, spacing: 15) {
                                // Your Name
                                VStack(alignment: .leading, spacing: 10) {
                                    Text("👤 Your Name")
                                        .font(.tenorSans(size: 16))
                                        .fontWeight(.bold)
                                        .foregroundColor(.cornellBlue)
                                    
                                    TextField("Your name (or 'Anonymous')", text: $senderName)
                                        .font(.tenorSans(size: 16))
                                        .padding(.vertical, 12)
                                        .padding(.horizontal)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 10)
                                                .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                                        )
                                    
                                    Text("This is your name that will appear on the card. If you want the letter to be anonymous, you can list your name as \"Anonymous\".")
                                        .font(.tenorSans(size: 12))
                                        .foregroundColor(.gray)
                                }
                                
                                // Recipient's Name
                                VStack(alignment: .leading, spacing: 10) {
                                    Text("📬 Recipient's Name")
                                        .font(.tenorSans(size: 16))
                                        .fontWeight(.bold)
                                        .foregroundColor(.cornellBlue)
                                    
                                    TextField("Recipient's name", text: $recipientName)
                                        .font(.tenorSans(size: 16))
                                        .padding(.vertical, 12)
                                        .padding(.horizontal)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 10)
                                                .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                                        )
                                    
                                    Text("This is the recipient's name that will appear on the card.")
                                        .font(.tenorSans(size: 12))
                                        .foregroundColor(.gray)
                                }
                                
                                // People Search
                                PeopleSearchView(selectedPerson: $selectedPerson)
                                
                                // Message Content
                                VStack(alignment: .leading, spacing: 10) {
                                    Text("💌 Your Message")
                                        .font(.tenorSans(size: 16))
                                        .fontWeight(.bold)
                                        .foregroundColor(.cornellBlue)
                                    
                                    ZStack(alignment: .topLeading) {
                                        TextEditor(text: $messageContent)
                                            .font(.tenorSans(size: 16))
                                            .frame(height: 150)
                                            .padding(5)
                                        
                                        if messageContent.isEmpty {
                                            Text("Thanks for being an inspiration to all the dining hall cashiers out there, including me! Your food at Okenshields is mid but your music is fire; you gotta teach me how to DJ one day!")
                                                .font(.tenorSans(size: 16))
                                                .foregroundColor(Color(UIColor.placeholderText))
                                                .padding(.horizontal, 10)
                                                .padding(.vertical, 14)
                                                .allowsHitTesting(false)
                                        }
                                    }
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 10)
                                            .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                                    )
                                    
                                    Text("Please limit your note to no more than 150 words to ensure it fits on the card.")
                                        .font(.tenorSans(size: 12))
                                        .foregroundColor(.gray)
                                }
                                
                                // Form Errors
                                if !formErrors.isEmpty {
                                    VStack(alignment: .leading, spacing: 5) {
                                        Text("Please fix the following errors:")
                                            .font(.tenorSans(size: 14))
                                            .fontWeight(.bold)
                                        
                                        ForEach(formErrors, id: \.self) { error in
                                            Text("• \(error)")
                                                .font(.tenorSans(size: 14))
                                        }
                                    }
                                    .padding()
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(Color.cornellRed.opacity(0.1))
                                    .foregroundColor(.cornellRed)
                                    .cornerRadius(10)
                                }
                                
                                // Submit Button
                                Button(action: handleSubmit) {
                                    if isSubmitting {
                                        ProgressView()
                                            .tint(.white)
                                    } else {
                                        Text("Submit Message")
                                            .font(.tenorSans(size: 18))
                                            .fontWeight(.bold)
                                    }
                                }
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background(Color.cornellRed)
                                .foregroundColor(.white)
                                .cornerRadius(30)
                                .padding(.top, 10)
                                .disabled(isSubmitting)
                                
                                Text("Your message will be delivered on the last day of classes.")
                                    .font(.tenorSans(size: 14))
                                    .foregroundColor(.gray)
                                    .frame(maxWidth: .infinity)
                                    .padding(.bottom, 30)
                            }
                        }
                        .padding(.horizontal)
                    } else if environment.status == nil || environment.config == nil {
                        LoadingView()
                            .padding(.top, 50)
                    } else {
                        // Not logged in
                        AuthPromptView(
                            title: "Sign In to Send Messages",
                            description: "Sign in with your Cornell NetID to send Lifted messages and spread gratitude across campus!",
                            loginAction: {
                                await environment.login()
                            }
                        )
                        .padding(.top, 40)
                    }
                }
            }
            .onAppear {
                loadFormDescription()
            }
            .alert("Message Sent!", isPresented: $showSuccessDialog) {
                Button("View Sent Messages") {
                    selectedTab = 2 // Switch to View Messages tab
                    resetForm()
                }
                Button("Send Another", role: .cancel) {
                    resetForm()
                }
            } message: {
                Text("Your Lifted message to \(confirmedRecipientEmail) was submitted successfully! Your recipient was just notified that they've been Lifted, but they won't get to see your message until the last day of classes!")
            }
            .alert("Error", isPresented: $showErrorDialog) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(errorMessage)
            }
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("Send a Message")
                        .font(.schoolbell(size: 30))
                        .foregroundStyle(.cornellRed)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
        }
    }
    
    private func loadFormDescription() {
        Task {
            do {
                let desc = try await environment.api.getFormDescription()
                await MainActor.run {
                    self.formDescription = desc
                    self.isLoadingForm = false
                }
            } catch {
                await MainActor.run {
                    self.isLoadingForm = false
                }
            }
        }
    }
    
    private func validateForm() -> Bool {
        var errors: [String] = []
        if senderName.isEmpty { errors.append("Sender name is required.") }
        if recipientName.isEmpty { errors.append("Recipient name is required.") }
        if selectedPerson == nil { errors.append("Recipient NetID is required.") }
        if messageContent.isEmpty { errors.append("Message content is required.") }
        
        self.formErrors = errors
        return errors.isEmpty
    }
    
    private func handleSubmit() {
        guard validateForm() else { return }
        
        isSubmitting = true
        Task {
            do {
                let response = try await environment.api.sendMessage(
                    senderName: senderName,
                    recipientName: recipientName,
                    recipientNetID: selectedPerson?.NetID ?? "",
                    messageContent: messageContent
                )
                
                await MainActor.run {
                    isSubmitting = false
                    if response.message_confirmation {
                        confirmedRecipientEmail = response.recipient_email ?? ""
                        showSuccessDialog = true
                        // Refresh messages list in background
                        Task { await messagesViewModel.getMessages() }
                    } else {
                        errorMessage = response.error ?? "Failed to send message. Please try again later."
                        showErrorDialog = true
                    }
                }
            } catch {
                await MainActor.run {
                    isSubmitting = false
                    errorMessage = "Failed to send message. Please check your connection."
                    showErrorDialog = true
                }
            }
        }
    }
    
    private func resetForm() {
        senderName = ""
        recipientName = ""
        selectedPerson = nil
        messageContent = ""
        formErrors = []
    }
}
