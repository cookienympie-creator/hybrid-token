// src/wallet_linker_idl.ts
export type WalletLinker = {
  address: string;
  metadata: {
    name: string;
    version: string;
    spec: string;
  };
  version: "0.1.0";
  name: "hybrid_token";
  instructions: [
    {
      name: "initialize";
      accounts: [
        {
          name: "initializer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "grantDelegation";
      accounts: [
        {
          name: "admin";
          isMut: true;
          isSigner: true;
        },
        {
          name: "user";
          isMut: false;
          isSigner: false;
        },
        {
          name: "bot";
          isMut: false;
          isSigner: false;
        },
        {
          name: "delegation";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "maxAmount";
          type: "u64";
        },
        {
          name: "durationDays";
          type: "u32";
        }
      ];
    },
    {
      name: "withdrawFromUser";
      accounts: [
        {
          name: "bot";
          isMut: true;
          isSigner: true;
        },
        {
          name: "user";
          isMut: true;
          isSigner: false;
        },
        {
          name: "botWallet";
          isMut: true;
          isSigner: false;
        },
        {
          name: "delegation";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "depositToUser";
      accounts: [
        {
          name: "bot";
          isMut: true;
          isSigner: true;
        },
        {
          name: "user";
          isMut: true;
          isSigner: false;
        },
        {
          name: "botWallet";
          isMut: true;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "revokeDelegation";
      accounts: [
        {
          name: "admin";
          isMut: true;
          isSigner: true;
        },
        {
          name: "user";
          isMut: false;
          isSigner: false;
        },
        {
          name: "bot";
          isMut: false;
          isSigner: false;
        },
        {
          name: "delegation";
          isMut: true;
          isSigner: false;
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "delegation";
      type: {
        kind: "struct";
        fields: [
          {
            name: "user";
            type: "publicKey";
          },
          {
            name: "bot";
            type: "publicKey";
          },
          {
            name: "maxAmount";
            type: "u64";
          },
          {
            name: "expiryTime";
            type: "i64";
          },
          {
            name: "isActive";
            type: "bool";
          },
          {
            name: "bump";
            type: "u8";
          }
        ];
      };
    }
  ];
  events: [
    {
      name: "DelegationGranted";
      fields: [
        {
          name: "user";
          type: "publicKey";
          index: false;
        },
        {
          name: "bot";
          type: "publicKey";
          index: false;
        },
        {
          name: "maxAmount";
          type: "u64";
          index: false;
        },
        {
          name: "expiryTime";
          type: "i64";
          index: false;
        }
      ];
    },
    {
      name: "DelegationRevoked";
      fields: [
        {
          name: "user";
          type: "publicKey";
          index: false;
        },
        {
          name: "bot";
          type: "publicKey";
          index: false;
        }
      ];
    },
    {
      name: "FundsWithdrawn";
      fields: [
        {
          name: "user";
          type: "publicKey";
          index: false;
        },
        {
          name: "bot";
          type: "publicKey";
          index: false;
        },
        {
          name: "amount";
          type: "u64";
          index: false;
        }
      ];
    },
    {
      name: "FundsDeposited";
      fields: [
        {
          name: "user";
          type: "publicKey";
          index: false;
        },
        {
          name: "bot";
          type: "publicKey";
          index: false;
        },
        {
          name: "amount";
          type: "u64";
          index: false;
        }
      ];
    }
  ];
  errors: [
    {
      code: 6000;
      name: "NoActiveDelegation";
      msg: "No active delegation found";
    },
    {
      code: 6001;
      name: "DelegationExpired";
      msg: "Delegation has expired";
    },
    {
      code: 6002;
      name: "ExceedsMaxAmount";
      msg: "Amount exceeds maximum allowed";
    },
    {
      code: 6003;
      name: "InsufficientFunds";
      msg: "Insufficient funds";
    },
    {
      code: 6004;
      name: "Unauthorized";
      msg: "Unauthorized action";
    }
  ];
};

export const IDL: WalletLinker = {
  address: "3cGxqm1zBZBUnbPxoNKwe6d1s5TgJrtuH2fBqM6Mwfv2",
  metadata: {
    name: "hybrid_token",
    version: "0.1.0",
    spec: "0.1.0"
  },
  version: "0.1.0",
  name: "hybrid_token",
  instructions: [
    {
      name: "initialize",
      accounts: [
        {
          name: "initializer",
          isMut: true,
          isSigner: true
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: []
    },
    {
      name: "grantDelegation",
      accounts: [
        {
          name: "admin",
          isMut: true,
          isSigner: true
        },
        {
          name: "user",
          isMut: false,
          isSigner: false
        },
        {
          name: "bot",
          isMut: false,
          isSigner: false
        },
        {
          name: "delegation",
          isMut: true,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "maxAmount",
          type: "u64"
        },
        {
          name: "durationDays",
          type: "u32"
        }
      ]
    },
    {
      name: "withdrawFromUser",
      accounts: [
        {
          name: "bot",
          isMut: true,
          isSigner: true
        },
        {
          name: "user",
          isMut: true,
          isSigner: false
        },
        {
          name: "botWallet",
          isMut: true,
          isSigner: false
        },
        {
          name: "delegation",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "amount",
          type: "u64"
        }
      ]
    },
    {
      name: "depositToUser",
      accounts: [
        {
          name: "bot",
          isMut: true,
          isSigner: true
        },
        {
          name: "user",
          isMut: true,
          isSigner: false
        },
        {
          name: "botWallet",
          isMut: true,
          isSigner: false
        }
      ],
      args: [
        {
          name: "amount",
          type: "u64"
        }
      ]
    },
    {
      name: "revokeDelegation",
      accounts: [
        {
          name: "admin",
          isMut: true,
          isSigner: true
        },
        {
          name: "user",
          isMut: false,
          isSigner: false
        },
        {
          name: "bot",
          isMut: false,
          isSigner: false
        },
        {
          name: "delegation",
          isMut: true,
          isSigner: false
        }
      ],
      args: []
    }
  ],
  accounts: [
    {
      name: "delegation",
      type: {
        kind: "struct",
        fields: [
          {
            name: "user",
            type: "publicKey"
          },
          {
            name: "bot",
            type: "publicKey"
          },
          {
            name: "maxAmount",
            type: "u64"
          },
          {
            name: "expiryTime",
            type: "i64"
          },
          {
            name: "isActive",
            type: "bool"
          },
          {
            name: "bump",
            type: "u8"
          }
        ]
      }
    }
  ],
  events: [
    {
      name: "DelegationGranted",
      fields: [
        {
          name: "user",
          type: "publicKey",
          index: false
        },
        {
          name: "bot",
          type: "publicKey",
          index: false
        },
        {
          name: "maxAmount",
          type: "u64",
          index: false
        },
        {
          name: "expiryTime",
          type: "i64",
          index: false
        }
      ]
    },
    {
      name: "DelegationRevoked",
      fields: [
        {
          name: "user",
          type: "publicKey",
          index: false
        },
        {
          name: "bot",
          type: "publicKey",
          index: false
        }
      ]
    },
    {
      name: "FundsWithdrawn",
      fields: [
        {
          name: "user",
          type: "publicKey",
          index: false
        },
        {
          name: "bot",
          type: "publicKey",
          index: false
        },
        {
          name: "amount",
          type: "u64",
          index: false
        }
      ]
    },
    {
      name: "FundsDeposited",
      fields: [
        {
          name: "user",
          type: "publicKey",
          index: false
        },
        {
          name: "bot",
          type: "publicKey",
          index: false
        },
        {
          name: "amount",
          type: "u64",
          index: false
        }
      ]
    }
  ],
  errors: [
    {
      code: 6000,
      name: "NoActiveDelegation",
      msg: "No active delegation found"
    },
    {
      code: 6001,
      name: "DelegationExpired",
      msg: "Delegation has expired"
    },
    {
      code: 6002,
      name: "ExceedsMaxAmount",
      msg: "Amount exceeds maximum allowed"
    },
    {
      code: 6003,
      name: "InsufficientFunds",
      msg: "Insufficient funds"
    },
    {
      code: 6004,
      name: "Unauthorized",
      msg: "Unauthorized action"
    }
  ]
};
