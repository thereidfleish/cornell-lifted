//
//  Status.swift
//  Cornell Lifted
//
//  Created by Reid Fleishman on 1/4/26.
//

import Foundation

struct Status: Codable {
    let authenticated: Bool
    let impersonating: Bool?
    let user: User?
}

struct User: Codable, Identifiable {
    let admin_write_perm: Bool
    let email: String
    let id: String
    let is_admin: Bool
    let name: String
}
