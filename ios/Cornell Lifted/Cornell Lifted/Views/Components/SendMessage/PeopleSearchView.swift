//
//  PeopleSearchView.swift
//  Cornell Lifted
//

import SwiftUI

struct PeopleSearchView: View {
    @EnvironmentObject var environment: AppEnvironment
    @Binding var selectedPerson: Person?
    
    @State private var searchInput = ""
    @State private var searchResults: [Person] = []
    @State private var searchStatus = ""
    @State private var isLoading = false
    @State private var expandedSearch = false
    @State private var easterEgg = ""
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("🔍 Select Recipient")
                .font(.tenorSans(size: 16))
                .fontWeight(.bold)
                .foregroundColor(.cornellBlue)
            
            TextField("Search by name or NetID...", text: $searchInput)
                .font(.tenorSans(size: 16))
                .padding(.vertical, 12)
                .padding(.horizontal)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                )
            
            Text("Search for a name or NetID above, then select it from the results below.")
                .font(.tenorSans(size: 12))
                .foregroundColor(.gray)
            
            if let selected = selectedPerson {
                let affiliation = selected.PrimaryAffiliation.lowercased()
                let goodAffiliations = ["student", "faculty", "staff", "academic", "temporary"]
                let isGoodAffiliation = goodAffiliations.contains(affiliation)
                let textColorHex = isGoodAffiliation ? "#14532D" : "#713F12"
                
                VStack(alignment: .leading, spacing: 5) {
                    HTMLText(
                        html: "Selected: <b>\(selected.NetID)</b> (\(selected.Name), \(selected.PrimaryAffiliation))",
                        fontSize: 14,
                        colorHex: textColorHex
                    )
                    
                    if !easterEgg.isEmpty {
                        HTMLText(
                            html: "<i>\(easterEgg)</i>",
                            fontSize: 14,
                            colorHex: textColorHex
                        )
                    }
                    
                    if environment.status?.user?.email == "\(selected.NetID)@cornell.edu" {
                        Text("- Wait, that's you! While you can technically send a Lifted message to yourself, we encourage you to also spread the love to those around you :)")
                            .font(.tenorSans(size: 12))
                            .foregroundColor(isGoodAffiliation ? Color(red: 20/255, green: 83/255, blue: 45/255) : Color(red: 113/255, green: 63/255, blue: 18/255))
                    }
                    
                    if !isGoodAffiliation {
                        Text("This person is a(n) \(selected.PrimaryAffiliation). Are you sure you selected the correct person?")
                            .font(.tenorSans(size: 12))
                            .foregroundColor(Color(red: 113/255, green: 63/255, blue: 18/255)) // yellow-900
                    }
                }
                .padding(10)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(isGoodAffiliation ? Color(red: 240/255, green: 253/255, blue: 244/255) : Color(red: 254/255, green: 252/255, blue: 232/255)) // green-50 : yellow-50
                .cornerRadius(10)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(isGoodAffiliation ? Color(red: 187/255, green: 247/255, blue: 208/255) : Color(red: 254/255, green: 240/255, blue: 138/255), lineWidth: 1) // green-200 : yellow-200
                )
            }
            
            if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity)
                    .padding()
            } else {
                if !searchStatus.isEmpty {
                    Text(searchStatus)
                        .font(.tenorSans(size: 14))
                        .foregroundColor(.gray)
                }
                
                if searchResults.isEmpty && !searchInput.isEmpty && !isLoading && !expandedSearch {
                    VStack(spacing: 10) {
                        Text("Looking to send to an alumnus or someone else?")
                            .font(.tenorSans(size: 14))
                        
                        Button(action: {
                            expandedSearch = true
                            // Setting expandedSearch to true triggers the task again
                        }) {
                            Text("Expand Search")
                                .font(.tenorSans(size: 14))
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .padding(.horizontal, 20)
                                .padding(.vertical, 8)
                                .background(Color.cornellBlue)
                                .cornerRadius(20)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.cornellBlue.opacity(0.05))
                    .cornerRadius(10)
                }
                
                if !searchResults.isEmpty {
                    ScrollView {
                        VStack(spacing: 0) {
                            ForEach(searchResults) { person in
                                Button(action: {
                                    selectedPerson = person
                                    fetchEasterEgg(netID: person.NetID)
                                }) {
                                    VStack(alignment: .leading, spacing: 4) {
                                        HStack {
                                            Text(person.Name)
                                                .font(.tenorSans(size: 16))
                                                .fontWeight(.bold)
                                                .foregroundColor(selectedPerson?.NetID == person.NetID ? .white : .primary)
                                            Spacer()
                                            Text(person.NetID)
                                                .font(.tenorSans(size: 14))
                                                .foregroundColor(selectedPerson?.NetID == person.NetID ? .white.opacity(0.8) : .gray)
                                        }
                                        Text(person.PrimaryAffiliation)
                                            .font(.tenorSans(size: 12))
                                            .foregroundColor(selectedPerson?.NetID == person.NetID ? .white.opacity(0.8) : .gray)
                                        
                                        if !person.PrimaryDept.isEmpty && person.PrimaryDept.lowercased() != "none" {
                                            Text(person.PrimaryDept)
                                                .font(.tenorSans(size: 12))
                                                .foregroundColor(selectedPerson?.NetID == person.NetID ? .white.opacity(0.8) : .gray)
                                        }
                                        if !person.PrimaryTitle.isEmpty && person.PrimaryTitle.lowercased() != "none" {
                                            Text(person.PrimaryTitle)
                                                .font(.tenorSans(size: 12))
                                                .foregroundColor(selectedPerson?.NetID == person.NetID ? .white.opacity(0.8) : .gray)
                                        }
                                        if !person.College.isEmpty && person.College.lowercased() != "none" {
                                            Text(person.College)
                                                .font(.tenorSans(size: 12))
                                                .foregroundColor(selectedPerson?.NetID == person.NetID ? .white.opacity(0.8) : .gray)
                                        }
                                    }
                                    .padding(.vertical, 10)
                                    .padding(.horizontal, 10)
                                    .background(selectedPerson?.NetID == person.NetID ? Color.cornellBlue : Color.clear)
                                    .cornerRadius(8)
                                    .contentShape(Rectangle())
                                }
                                .buttonStyle(PlainButtonStyle())
                                
                                Divider()
                            }
                        }
                    }
                    .frame(maxHeight: 250)
                }
            }
        }
        .task(id: searchInput) {
            await runSearchDebounce()
        }
        .task(id: expandedSearch) {
            if expandedSearch {
                await runSearchDebounce()
            }
        }
    }
    
    private func runSearchDebounce() async {
        guard !searchInput.isEmpty else {
            searchResults = []
            searchStatus = ""
            isLoading = false
            return
        }
        
        isLoading = true
        
        do {
            // Debounce by sleeping for 700ms. If searchInput changes, this task gets cancelled.
            try await Task.sleep(nanoseconds: 700_000_000)
        } catch {
            return // Task cancelled
        }
        
        await performSearch(query: searchInput)
    }
    
    private func performSearch(query: String) async {
        do {
            let results = try await environment.api.peopleSearch(query: query, expanded: expandedSearch)
            await MainActor.run {
                self.searchResults = results
                self.isLoading = false
                if results.isEmpty {
                    self.searchStatus = "No results found. Check your spelling or try typing in the exact NetID."
                } else {
                    self.searchStatus = "\(results.count) result(s) found. Select a person below."
                }
            }
        } catch {
            await MainActor.run {
                self.isLoading = false
                self.searchStatus = "Search failed. Please try again."
            }
        }
    }
    
    private func fetchEasterEgg(netID: String) {
        Task {
            do {
                let result = try await environment.api.getEasterEgg(netID: netID)
                await MainActor.run {
                    self.easterEgg = result
                }
            } catch {
                // Ignore error for easter egg
            }
        }
    }
}
