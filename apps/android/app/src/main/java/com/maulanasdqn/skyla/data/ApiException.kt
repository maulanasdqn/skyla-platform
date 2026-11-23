package com.maulanasdqn.skyla.data

class ApiException(val status: Int, message: String) : Exception(message)
