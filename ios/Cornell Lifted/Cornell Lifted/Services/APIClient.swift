//
//  APIClient.swift
//  Cornell Lifted
//
//  Created by Reid Fleishman on 1/4/26.
//

import Foundation

final class APIClient {
    let url = "https://api.cornelllifted.com/api"
    
    func getStatus() async throws -> Status {
        let url = URL(string: "\(url)/auth/status")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder()
            .decode(Status.self, from: data)
    }
    
    func getConfig() async throws -> Config {
        let url = URL(string: "\(url)/config")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder()
            .decode(Config.self, from: data)
    }
}
