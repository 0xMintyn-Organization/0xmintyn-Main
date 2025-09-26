/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/ubi_program.json`.
 */
export type UbiProgramIDL = {
  "address": "CsKFzRYMSJpE3ndUJwKy38f7CYqc5PTCD6MEYPNMdwbN",
  "metadata": {
    "name": "ubiProgram",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "claimInitialUbi",
      "docs": [
        "Claim initial UBI (one-time $2000 distribution)"
      ],
      "discriminator": [
        63,
        10,
        248,
        119,
        251,
        98,
        42,
        190
      ],
      "accounts": [
        {
          "name": "user",
          "signer": true
        },
        {
          "name": "ubiConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "userProfile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "fraudDetection",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  114,
                  97,
                  117,
                  100,
                  95,
                  100,
                  101,
                  116,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "ubiConfig"
              }
            ]
          }
        },
        {
          "name": "treasuryTokenAccount",
          "writable": true
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "claimMonthlyUbi",
      "docs": [
        "Claim monthly recurring UBI ($1000 equivalent)"
      ],
      "discriminator": [
        174,
        187,
        136,
        238,
        254,
        252,
        136,
        211
      ],
      "accounts": [
        {
          "name": "user",
          "signer": true
        },
        {
          "name": "ubiConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "userProfile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "fraudDetection",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  114,
                  97,
                  117,
                  100,
                  95,
                  100,
                  101,
                  116,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "ubiConfig"
              }
            ]
          }
        },
        {
          "name": "treasuryTokenAccount",
          "writable": true
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "fundTreasury",
      "docs": [
        "Admin function to fund the treasury"
      ],
      "discriminator": [
        71,
        154,
        45,
        220,
        206,
        32,
        174,
        239
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "ubiConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "ubiConfig"
              }
            ]
          }
        },
        {
          "name": "adminTokenAccount",
          "writable": true
        },
        {
          "name": "treasuryTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeProgram",
      "docs": [
        "Initialize the UBI program with treasury and configuration"
      ],
      "discriminator": [
        176,
        107,
        205,
        168,
        24,
        157,
        175,
        103
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "ubiConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "ubiConfig"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "admin",
          "type": "pubkey"
        },
        {
          "name": "tokenMint",
          "type": "pubkey"
        },
        {
          "name": "maxUsers",
          "type": "u32"
        }
      ]
    },
    {
      "name": "initializeUser",
      "docs": [
        "Register new user and distribute welcome bonus"
      ],
      "discriminator": [
        111,
        17,
        185,
        250,
        60,
        122,
        38,
        254
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "ubiConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "userProfile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "fraudDetection",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  114,
                  97,
                  117,
                  100,
                  95,
                  100,
                  101,
                  116,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "ubiConfig"
              }
            ]
          }
        },
        {
          "name": "treasuryTokenAccount",
          "writable": true
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "identityHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "referralCode",
          "type": {
            "option": "string"
          }
        }
      ]
    },
    {
      "name": "reportFraud",
      "docs": [
        "Report suspicious activity (can be called by anyone)"
      ],
      "discriminator": [
        197,
        111,
        235,
        49,
        151,
        143,
        182,
        154
      ],
      "accounts": [
        {
          "name": "reporter",
          "signer": true
        },
        {
          "name": "fraudDetection",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  114,
                  97,
                  117,
                  100,
                  95,
                  100,
                  101,
                  116,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "fraudDetection.user",
                "account": "FraudDetection"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "reportedUser",
          "type": "pubkey"
        },
        {
          "name": "reason",
          "type": "string"
        }
      ]
    },
    {
      "name": "suspendUser",
      "docs": [
        "Admin function to suspend/unsuspend user"
      ],
      "discriminator": [
        231,
        239,
        17,
        160,
        182,
        128,
        204,
        195
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "ubiConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "userProfile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "userProfile.user",
                "account": "UserProfile"
              }
            ]
          }
        },
        {
          "name": "fraudDetection",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  114,
                  97,
                  117,
                  100,
                  95,
                  100,
                  101,
                  116,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "userProfile.user",
                "account": "UserProfile"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "suspend",
          "type": "bool"
        },
        {
          "name": "reason",
          "type": "string"
        }
      ]
    },
    {
      "name": "toggleProgram",
      "docs": [
        "Admin function to pause/unpause the program"
      ],
      "discriminator": [
        147,
        206,
        27,
        218,
        32,
        205,
        32,
        121
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "ubiConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "active",
          "type": "bool"
        }
      ]
    },
    {
      "name": "updateUbiAmounts",
      "docs": [
        "Admin function to update UBI amounts"
      ],
      "discriminator": [
        130,
        14,
        198,
        84,
        232,
        158,
        115,
        96
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "ubiConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newWelcomeBonus",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "newInitialUbi",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "newMonthlyUbi",
          "type": {
            "option": "u64"
          }
        }
      ]
    },
    {
      "name": "verifyUser",
      "docs": [
        "Admin function to verify user identity"
      ],
      "discriminator": [
        127,
        54,
        157,
        106,
        85,
        167,
        116,
        119
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "ubiConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "userProfile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "userProfile.user",
                "account": "UserProfile"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "verificationScore",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "FraudDetection",
      "discriminator": [
        89,
        113,
        13,
        68,
        150,
        8,
        176,
        107
      ]
    },
    {
      "name": "Treasury",
      "discriminator": [
        238,
        239,
        123,
        238,
        89,
        1,
        168,
        253
      ]
    },
    {
      "name": "UbiConfig",
      "discriminator": [
        90,
        101,
        194,
        43,
        254,
        23,
        84,
        206
      ]
    },
    {
      "name": "UserProfile",
      "discriminator": [
        32,
        37,
        119,
        205,
        179,
        180,
        13,
        194
      ]
    }
  ],
  "events": [
    {
      "name": "FraudReported",
      "discriminator": [
        129,
        128,
        197,
        74,
        187,
        182,
        4,
        85
      ]
    },
    {
      "name": "InitialUbiClaimed",
      "discriminator": [
        171,
        196,
        219,
        237,
        123,
        208,
        172,
        181
      ]
    },
    {
      "name": "MonthlyUbiClaimed",
      "discriminator": [
        83,
        139,
        148,
        174,
        250,
        235,
        205,
        181
      ]
    },
    {
      "name": "ProgramToggled",
      "discriminator": [
        242,
        201,
        84,
        55,
        231,
        180,
        252,
        38
      ]
    },
    {
      "name": "TreasuryFunded",
      "discriminator": [
        172,
        66,
        241,
        101,
        216,
        219,
        147,
        130
      ]
    },
    {
      "name": "UbiAmountsUpdated",
      "discriminator": [
        119,
        98,
        41,
        19,
        133,
        175,
        1,
        143
      ]
    },
    {
      "name": "UbiProgramInitialized",
      "discriminator": [
        142,
        225,
        233,
        63,
        38,
        223,
        91,
        236
      ]
    },
    {
      "name": "UserInitialized",
      "discriminator": [
        66,
        195,
        5,
        223,
        42,
        84,
        135,
        60
      ]
    },
    {
      "name": "UserSuspended",
      "discriminator": [
        90,
        110,
        94,
        61,
        28,
        234,
        116,
        151
      ]
    },
    {
      "name": "UserVerified",
      "discriminator": [
        191,
        18,
        15,
        86,
        86,
        109,
        153,
        63
      ]
    },
    {
      "name": "WelcomeBonusDistributed",
      "discriminator": [
        202,
        95,
        99,
        19,
        126,
        72,
        109,
        18
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "ProgramInactive",
      "msg": "Program is inactive"
    },
    {
      "code": 6001,
      "name": "MaxUsersReached",
      "msg": "Maximum users reached"
    },
    {
      "code": 6002,
      "name": "UserSuspended",
      "msg": "User is suspended"
    },
    {
      "code": 6003,
      "name": "UserNotVerified",
      "msg": "User is not verified"
    },
    {
      "code": 6004,
      "name": "InitialUbiAlreadyClaimed",
      "msg": "Initial UBI already claimed"
    },
    {
      "code": 6005,
      "name": "InitialUbiNotClaimed",
      "msg": "Initial UBI not claimed yet"
    },
    {
      "code": 6006,
      "name": "MonthlyPeriodNotMet",
      "msg": "Monthly period not met"
    },
    {
      "code": 6007,
      "name": "VerificationPeriodNotMet",
      "msg": "Verification period not met"
    },
    {
      "code": 6008,
      "name": "InsufficientVerificationScore",
      "msg": "Insufficient verification score"
    },
    {
      "code": 6009,
      "name": "UserFlagged",
      "msg": "User is flagged for suspicious activity"
    },
    {
      "code": 6010,
      "name": "UnauthorizedAdmin",
      "msg": "Unauthorized admin"
    },
    {
      "code": 6011,
      "name": "InvalidVerificationScore",
      "msg": "Invalid verification score"
    },
    {
      "code": 6012,
      "name": "InvalidAmount",
      "msg": "Invalid amount"
    },
    {
      "code": 6013,
      "name": "ArithmeticOverflow",
      "msg": "Arithmetic overflow"
    }
  ],
  "types": [
    {
      "name": "FraudDetection",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "identityHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "registrationTimestamp",
            "type": "i64"
          },
          {
            "name": "verificationAttempts",
            "type": "u8"
          },
          {
            "name": "isFlagged",
            "type": "bool"
          },
          {
            "name": "riskScore",
            "type": "u8"
          },
          {
            "name": "lastActivity",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "Treasury",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "totalFunded",
            "type": "u64"
          },
          {
            "name": "totalDistributed",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "UbiConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "welcomeBonusAmount",
            "type": "u64"
          },
          {
            "name": "initialUbiAmount",
            "type": "u64"
          },
          {
            "name": "monthlyUbiAmount",
            "type": "u64"
          },
          {
            "name": "maxUsers",
            "type": "u32"
          },
          {
            "name": "totalUsers",
            "type": "u32"
          },
          {
            "name": "totalDistributed",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "UserProfile",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "identityHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "registeredAt",
            "type": "i64"
          },
          {
            "name": "welcomeBonusClaimed",
            "type": "bool"
          },
          {
            "name": "initialUbiClaimed",
            "type": "bool"
          },
          {
            "name": "lastMonthlyClaim",
            "type": "i64"
          },
          {
            "name": "totalClaimed",
            "type": "u64"
          },
          {
            "name": "isVerified",
            "type": "bool"
          },
          {
            "name": "isSuspended",
            "type": "bool"
          },
          {
            "name": "referralCode",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "verificationScore",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};

export const IDL: UbiProgramIDL = {
  "address": "CsKFzRYMSJpE3ndUJwKy38f7CYqc5PTCD6MEYPNMdwbN",
  "metadata": {
    "name": "ubiProgram",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "claimInitialUbi",
      "docs": [
        "Claim initial UBI (one-time $2000 distribution)"
      ],
      "discriminator": [
        63,
        10,
        248,
        119,
        251,
        98,
        42,
        190
      ],
      "accounts": [
        {
          "name": "user",
          "signer": true
        },
        {
          "name": "ubiConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "userProfile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "fraudDetection",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  114,
                  97,
                  117,
                  100,
                  95,
                  100,
                  101,
                  116,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "ubiConfig"
              }
            ]
          }
        },
        {
          "name": "treasuryTokenAccount",
          "writable": true
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "claimMonthlyUbi",
      "docs": [
        "Claim monthly recurring UBI ($1000 equivalent)"
      ],
      "discriminator": [
        174,
        187,
        136,
        238,
        254,
        252,
        136,
        211
      ],
      "accounts": [
        {
          "name": "user",
          "signer": true
        },
        {
          "name": "ubiConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "userProfile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "fraudDetection",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  114,
                  97,
                  117,
                  100,
                  95,
                  100,
                  101,
                  116,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "ubiConfig"
              }
            ]
          }
        },
        {
          "name": "treasuryTokenAccount",
          "writable": true
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "fundTreasury",
      "docs": [
        "Admin function to fund the treasury"
      ],
      "discriminator": [
        71,
        154,
        45,
        220,
        206,
        32,
        174,
        239
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "ubiConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "ubiConfig"
              }
            ]
          }
        },
        {
          "name": "adminTokenAccount",
          "writable": true
        },
        {
          "name": "treasuryTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeProgram",
      "docs": [
        "Initialize the UBI program with treasury and configuration"
      ],
      "discriminator": [
        176,
        107,
        205,
        168,
        24,
        157,
        175,
        103
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "ubiConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "ubiConfig"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "admin",
          "type": "pubkey"
        },
        {
          "name": "tokenMint",
          "type": "pubkey"
        },
        {
          "name": "maxUsers",
          "type": "u32"
        }
      ]
    },
    {
      "name": "initializeUser",
      "docs": [
        "Register new user and distribute welcome bonus"
      ],
      "discriminator": [
        111,
        17,
        185,
        250,
        60,
        122,
        38,
        254
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "ubiConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "userProfile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "fraudDetection",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  114,
                  97,
                  117,
                  100,
                  95,
                  100,
                  101,
                  116,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "ubiConfig"
              }
            ]
          }
        },
        {
          "name": "treasuryTokenAccount",
          "writable": true
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "identityHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "referralCode",
          "type": {
            "option": "string"
          }
        }
      ]
    },
    {
      "name": "reportFraud",
      "docs": [
        "Report suspicious activity (can be called by anyone)"
      ],
      "discriminator": [
        197,
        111,
        235,
        49,
        151,
        143,
        182,
        154
      ],
      "accounts": [
        {
          "name": "reporter",
          "signer": true
        },
        {
          "name": "fraudDetection",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  114,
                  97,
                  117,
                  100,
                  95,
                  100,
                  101,
                  116,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "fraudDetection.user",
                "account": "FraudDetection"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "reportedUser",
          "type": "pubkey"
        },
        {
          "name": "reason",
          "type": "string"
        }
      ]
    },
    {
      "name": "suspendUser",
      "docs": [
        "Admin function to suspend/unsuspend user"
      ],
      "discriminator": [
        231,
        239,
        17,
        160,
        182,
        128,
        204,
        195
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "ubiConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "userProfile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "userProfile.user",
                "account": "UserProfile"
              }
            ]
          }
        },
        {
          "name": "fraudDetection",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  114,
                  97,
                  117,
                  100,
                  95,
                  100,
                  101,
                  116,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "userProfile.user",
                "account": "UserProfile"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "suspend",
          "type": "bool"
        },
        {
          "name": "reason",
          "type": "string"
        }
      ]
    },
    {
      "name": "toggleProgram",
      "docs": [
        "Admin function to pause/unpause the program"
      ],
      "discriminator": [
        147,
        206,
        27,
        218,
        32,
        205,
        32,
        121
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "ubiConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "active",
          "type": "bool"
        }
      ]
    },
    {
      "name": "updateUbiAmounts",
      "docs": [
        "Admin function to update UBI amounts"
      ],
      "discriminator": [
        130,
        14,
        198,
        84,
        232,
        158,
        115,
        96
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "ubiConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newWelcomeBonus",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "newInitialUbi",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "newMonthlyUbi",
          "type": {
            "option": "u64"
          }
        }
      ]
    },
    {
      "name": "verifyUser",
      "docs": [
        "Admin function to verify user identity"
      ],
      "discriminator": [
        127,
        54,
        157,
        106,
        85,
        167,
        116,
        119
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "ubiConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "userProfile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "userProfile.user",
                "account": "UserProfile"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "verificationScore",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "FraudDetection",
      "discriminator": [
        89,
        113,
        13,
        68,
        150,
        8,
        176,
        107
      ]
    },
    {
      "name": "Treasury",
      "discriminator": [
        238,
        239,
        123,
        238,
        89,
        1,
        168,
        253
      ]
    },
    {
      "name": "UbiConfig",
      "discriminator": [
        90,
        101,
        194,
        43,
        254,
        23,
        84,
        206
      ]
    },
    {
      "name": "UserProfile",
      "discriminator": [
        32,
        37,
        119,
        205,
        179,
        180,
        13,
        194
      ]
    }
  ],
  "events": [
    {
      "name": "FraudReported",
      "discriminator": [
        129,
        128,
        197,
        74,
        187,
        182,
        4,
        85
      ]
    },
    {
      "name": "InitialUbiClaimed",
      "discriminator": [
        171,
        196,
        219,
        237,
        123,
        208,
        172,
        181
      ]
    },
    {
      "name": "MonthlyUbiClaimed",
      "discriminator": [
        83,
        139,
        148,
        174,
        250,
        235,
        205,
        181
      ]
    },
    {
      "name": "ProgramToggled",
      "discriminator": [
        242,
        201,
        84,
        55,
        231,
        180,
        252,
        38
      ]
    },
    {
      "name": "TreasuryFunded",
      "discriminator": [
        172,
        66,
        241,
        101,
        216,
        219,
        147,
        130
      ]
    },
    {
      "name": "UbiAmountsUpdated",
      "discriminator": [
        119,
        98,
        41,
        19,
        133,
        175,
        1,
        143
      ]
    },
    {
      "name": "UbiProgramInitialized",
      "discriminator": [
        142,
        225,
        233,
        63,
        38,
        223,
        91,
        236
      ]
    },
    {
      "name": "UserInitialized",
      "discriminator": [
        66,
        195,
        5,
        223,
        42,
        84,
        135,
        60
      ]
    },
    {
      "name": "UserSuspended",
      "discriminator": [
        90,
        110,
        94,
        61,
        28,
        234,
        116,
        151
      ]
    },
    {
      "name": "UserVerified",
      "discriminator": [
        191,
        18,
        15,
        86,
        86,
        109,
        153,
        63
      ]
    },
    {
      "name": "WelcomeBonusDistributed",
      "discriminator": [
        202,
        95,
        99,
        19,
        126,
        72,
        109,
        18
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "ProgramInactive",
      "msg": "Program is inactive"
    },
    {
      "code": 6001,
      "name": "MaxUsersReached",
      "msg": "Maximum users reached"
    },
    {
      "code": 6002,
      "name": "UserSuspended",
      "msg": "User is suspended"
    },
    {
      "code": 6003,
      "name": "UserNotVerified",
      "msg": "User is not verified"
    },
    {
      "code": 6004,
      "name": "InitialUbiAlreadyClaimed",
      "msg": "Initial UBI already claimed"
    },
    {
      "code": 6005,
      "name": "InitialUbiNotClaimed",
      "msg": "Initial UBI not claimed yet"
    },
    {
      "code": 6006,
      "name": "MonthlyPeriodNotMet",
      "msg": "Monthly period not met"
    },
    {
      "code": 6007,
      "name": "VerificationPeriodNotMet",
      "msg": "Verification period not met"
    },
    {
      "code": 6008,
      "name": "InsufficientVerificationScore",
      "msg": "Insufficient verification score"
    },
    {
      "code": 6009,
      "name": "UserFlagged",
      "msg": "User is flagged for suspicious activity"
    },
    {
      "code": 6010,
      "name": "UnauthorizedAdmin",
      "msg": "Unauthorized admin"
    },
    {
      "code": 6011,
      "name": "InvalidVerificationScore",
      "msg": "Invalid verification score"
    },
    {
      "code": 6012,
      "name": "InvalidAmount",
      "msg": "Invalid amount"
    },
    {
      "code": 6013,
      "name": "ArithmeticOverflow",
      "msg": "Arithmetic overflow"
    }
  ],
  "types": [
    {
      "name": "FraudDetection",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "identityHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "registrationTimestamp",
            "type": "i64"
          },
          {
            "name": "verificationAttempts",
            "type": "u8"
          },
          {
            "name": "isFlagged",
            "type": "bool"
          },
          {
            "name": "riskScore",
            "type": "u8"
          },
          {
            "name": "lastActivity",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "Treasury",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "totalFunded",
            "type": "u64"
          },
          {
            "name": "totalDistributed",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "UbiConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "welcomeBonusAmount",
            "type": "u64"
          },
          {
            "name": "initialUbiAmount",
            "type": "u64"
          },
          {
            "name": "monthlyUbiAmount",
            "type": "u64"
          },
          {
            "name": "maxUsers",
            "type": "u32"
          },
          {
            "name": "totalUsers",
            "type": "u32"
          },
          {
            "name": "totalDistributed",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "UserProfile",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "identityHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "registeredAt",
            "type": "i64"
          },
          {
            "name": "welcomeBonusClaimed",
            "type": "bool"
          },
          {
            "name": "initialUbiClaimed",
            "type": "bool"
          },
          {
            "name": "lastMonthlyClaim",
            "type": "i64"
          },
          {
            "name": "totalClaimed",
            "type": "u64"
          },
          {
            "name": "isVerified",
            "type": "bool"
          },
          {
            "name": "isSuspended",
            "type": "bool"
          },
          {
            "name": "referralCode",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "verificationScore",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};

