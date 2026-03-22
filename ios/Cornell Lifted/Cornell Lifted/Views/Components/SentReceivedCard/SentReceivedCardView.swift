//
//  SentReceivedCardView.swift
//  Cornell Lifted
//
//  Created by reid.fleishman on 3/1/26.
//

import SwiftUI

struct SentReceivedCardView: View {
    @EnvironmentObject var environment: AppEnvironment
    @EnvironmentObject var viewModel: MessagesViewModel
    var type: MessagesType
    var season: String
    var year: Int
    var isLatestPhysical: Bool
    
    @State private var showingReceived = true
    @State private var selectedCardId: Int?
    @State private var isShowingModal = false
    @State private var overrideHiddenMessage = false
    
    let columns = [
        GridItem(.flexible(), spacing: 15),
        GridItem(.flexible(), spacing: 15),
        GridItem(.flexible(), spacing: 15),
        GridItem(.flexible(), spacing: 15)
    ]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("\(season) \(String(year)) \(type.type_name)")
                .font(.schoolbell(size: 22))
                .foregroundColor(type.type == "p" ? .cornellBlue : .cornellRed)
                .padding(.horizontal)
            
            HStack(spacing: 12) {
                MessageToggleButton(title: "Received",
                                   count: type.received_count,
                                   isSelected: showingReceived) {
                    showingReceived = true
                }
                
                MessageToggleButton(title: "Sent",
                                   count: type.sent_count,
                                   isSelected: !showingReceived) {
                    showingReceived = false
                }
                
                Spacer()
            }
            .padding(.horizontal)
            
            let currentCount = showingReceived ? type.received_count : type.sent_count
            let currentRank = showingReceived ? type.received_rank : type.sent_rank
            let cardIds = showingReceived ? type.received_card_ids : type.sent_card_ids
            
            if currentCount > 0 {
                // Ranking Banner
                if let rank = currentRank, rank <= 3 {
                    HStack {
                        Text("🏆")
                            .font(.title2)
                        Text(LocalizedStringKey("You \(showingReceived ? "received" : "sent") the **\(rank)\(rank == 1 ? "st" : rank == 2 ? "nd" : rank == 3 ? "rd" : "th")** most messages out of all Cornellians!"))
                            .font(.tenorSans(size: 14))
                    }
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.yellow.opacity(0.2))
                    .cornerRadius(15)
                    .overlay(
                        RoundedRectangle(cornerRadius: 15)
                            .stroke(Color.yellow.opacity(0.3), lineWidth: 1)
                    )
                    .padding(.horizontal)
                }
                
                if showingReceived && type.hide_cards {
                    VStack(spacing: 15) {
                        if type.type == "p" {
                            if isLatestPhysical {
                                VStack(spacing: 10) {
                                    Text("🎈 Coming Soon!")
                                        .font(.schoolbell(size: 28))
                                        .foregroundColor(.cornellRed)
                                        .multilineTextAlignment(.center)
                                    
                                    Text("Pick up your \(type.received_count) physical card\(type.received_count != 1 ? "s" : "") in the **Willard Straight Hall Lobby before 7 PM** on the last day of classes **(Monday, December 8th)!**")
                                        .font(.tenorSans(size: 16))
                                        .multilineTextAlignment(.center)
                                    
                                    if let chosen = type.chosen_attachment {
                                        Text("You'll also receive a **\(chosen.attachment_name)** alongside your cards!")
                                            .font(.tenorSans(size: 16))
                                            .multilineTextAlignment(.center)
                                    }
                                    
                                    Text("Keep an eye on your email for details!")
                                        .font(.tenorSans(size: 14))
                                        .foregroundColor(.gray)
                                        .multilineTextAlignment(.center)
                                }
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background(Color.white)
                                .cornerRadius(15)
                                .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
                            } else {
                                VStack(spacing: 10) {
                                    Text("🎈")
                                        .font(.largeTitle)
                                    Text("We hope you enjoyed Lifted!")
                                        .font(.schoolbell(size: 28))
                                        .foregroundColor(.cornellRed)
                                        .multilineTextAlignment(.center)
                                    Text("Since you received physical cards, you can't view them here")
                                        .font(.tenorSans(size: 14))
                                        .foregroundColor(.gray)
                                        .multilineTextAlignment(.center)
                                }
                                .padding()
                                .frame(maxWidth: .infinity)
                            }
                        } else {
                            VStack(spacing: 10) {
                                Text("💌 Coming Soon!")
                                    .font(.schoolbell(size: 28))
                                    .foregroundColor(.cornellRed)
                                    .multilineTextAlignment(.center)
                                Text("Your \(type.received_count) eLifted message\(type.received_count != 1 ? "s" : "") will be available here on the last day of classes!")
                                    .font(.tenorSans(size: 16))
                                    .multilineTextAlignment(.center)
                            }
                            .padding()
                            .frame(maxWidth: .infinity)
                        }
                        
                        // Attachment selection
                        if type.message_group == environment.config?.attachment_message_group {
                            ChooseAttachmentView(messageGroup: type.message_group)
                                .environmentObject(environment)
                                .environmentObject(viewModel)
                        }
                        
                        // Swapping behavior
                        if type.message_group == environment.config?.swap_from {
                            SwapCardsView(swapText: environment.config?.swap_text ?? "")
                                .environmentObject(environment)
                                .environmentObject(viewModel)
                        }
                    }
                    .padding(.horizontal)
                } else {
                    LazyVGrid(columns: columns, spacing: 25) {
                        ForEach(Array(cardIds.enumerated()), id: \.offset) { index, id in
                            MessageEmojiButton(index: index) {
                                self.selectedCardId = id
                                self.overrideHiddenMessage = !type.hide_cards
                                self.isShowingModal = true
                            }
                        }
                    }
                    .padding()
                }
            } else {
                Text("You did not \(showingReceived ? "receive" : "send") any \(type.type_name) messages.")
                    .font(.tenorSans(size: 16))
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 40)
            }
        }
        .padding(.vertical)
        .background(Color.white)
        .cornerRadius(20)
        .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 5)
        .sheet(item: Binding(
            get: { selectedCardId.map { IdentifiableInt(id: $0) } },
            set: { selectedCardId = $0?.id }
        )) { item in
            MessageModalView(cardId: item.id, overrideHiddenMessage: overrideHiddenMessage)
                .environmentObject(environment)
                .environmentObject(viewModel)
        }
    }
}

struct IdentifiableInt: Identifiable {
    let id: Int
}

#Preview {
    let api = APIClient()
    SentReceivedCardView(type: MessagesType(chosen_attachment: MessagesChosenAttachment(id: 21, attachment_name: "Balloon"), hide_cards: true, message_group: "sp_25_p", received_card_ids: [16916, 17605, 17878], received_count: 3, received_rank: 1, sent_card_ids: [17473, 17476, 17479], sent_count: 4, sent_rank: 2, type: "p", type_name: "Physical Lifted"), season: "Spring", year: 2025, isLatestPhysical: true)
        .environmentObject(AppEnvironment(api: api, authService: AuthService()))
        .environmentObject(MessagesViewModel(api: api))
}
