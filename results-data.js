// Reported values from arXiv:2609.39056v1, Tables 1–2.
// Keep the reported averages and speedups; do not recompute from rounded values.
const benchmarkData = {
  "models": [
    "Cosmos-Policy",
    "FastWAMJoint",
    "Cosmos-Edge"
  ],
  "suites": [
    "Spatial",
    "Object",
    "Goal",
    "Long",
    "Avg"
  ],
  "success": [
    {
      "precision": "FP",
      "method": "Original",
      "Cosmos-Policy": [
        98.3,
        100.0,
        97.9,
        98.0,
        98.5
      ],
      "FastWAMJoint": [
        99.2,
        99.4,
        98.6,
        98.4,
        98.9
      ],
      "Cosmos-Edge": 21.83
    },
    {
      "precision": "W4A8",
      "method": "SmoothQuant",
      "Cosmos-Policy": [
        98.0,
        99.7,
        98.4,
        95.6,
        97.9
      ],
      "FastWAMJoint": [
        96.8,
        98.4,
        97.2,
        96.2,
        97.2
      ],
      "Cosmos-Edge": 13.67
    },
    {
      "precision": "W4A8",
      "method": "PTQ4DiT",
      "Cosmos-Policy": [
        98.8,
        99.6,
        96.1,
        97.7,
        98.1
      ],
      "FastWAMJoint": [
        97.8,
        98.6,
        98.0,
        96.0,
        97.6
      ],
      "Cosmos-Edge": 13.67
    },
    {
      "precision": "W4A8",
      "method": "Q-DiT",
      "Cosmos-Policy": [
        97.5,
        99.9,
        96.8,
        96.7,
        97.7
      ],
      "FastWAMJoint": [
        97.4,
        98.4,
        97.8,
        96.6,
        97.6
      ],
      "Cosmos-Edge": 12.17
    },
    {
      "precision": "W4A8",
      "method": "SteerQuant",
      "Cosmos-Policy": [
        98.3,
        99.9,
        98.1,
        98.0,
        98.6
      ],
      "FastWAMJoint": [
        97.8,
        99.4,
        98.2,
        96.8,
        98.1
      ],
      "Cosmos-Edge": 14.67
    },
    {
      "precision": "W4A4",
      "method": "QuaRot",
      "Cosmos-Policy": [
        98.2,
        99.2,
        96.1,
        98.1,
        97.9
      ],
      "FastWAMJoint": [
        99.0,
        99.6,
        98.2,
        97.8,
        98.7
      ],
      "Cosmos-Edge": 12.25
    },
    {
      "precision": "W4A4",
      "method": "Atom",
      "Cosmos-Policy": [
        96.2,
        98.7,
        96.6,
        97.3,
        97.2
      ],
      "FastWAMJoint": [
        97.8,
        97.4,
        98.8,
        98.6,
        98.2
      ],
      "Cosmos-Edge": 13.5
    },
    {
      "precision": "W4A4",
      "method": "SVDQuant",
      "Cosmos-Policy": [
        98.4,
        99.7,
        96.7,
        97.7,
        98.1
      ],
      "FastWAMJoint": [
        98.2,
        98.4,
        98.6,
        97.6,
        98.2
      ],
      "Cosmos-Edge": 16.0
    },
    {
      "precision": "W4A4",
      "method": "SteerQuant",
      "Cosmos-Policy": [
        98.3,
        99.7,
        97.7,
        97.5,
        98.3
      ],
      "FastWAMJoint": [
        98.8,
        99.8,
        98.4,
        96.6,
        98.4
      ],
      "Cosmos-Edge": 17.33
    }
  ],
  "efficiency": [
    {
      "precision": "FP",
      "method": "Original",
      "Cosmos-Policy": [
        261.46,
        1.0,
        4.241,
        3.644
      ],
      "FastWAMJoint": [
        360.45,
        1.0,
        12.116,
        11.23
      ],
      "Cosmos-Edge": [
        881.637,
        1.0,
        8.492,
        6.276
      ]
    },
    {
      "precision": "W4A8",
      "method": "SmoothQuant",
      "Cosmos-Policy": [
        134.967,
        1.937,
        1.607,
        1.191
      ],
      "FastWAMJoint": [
        263.368,
        1.369,
        3.363,
        2.983
      ],
      "Cosmos-Edge": [
        570.893,
        1.544,
        6.405,
        4.314
      ]
    },
    {
      "precision": "W4A8",
      "method": "SteerQuant",
      "Cosmos-Policy": [
        133.455,
        1.959,
        1.642,
        1.191
      ],
      "FastWAMJoint": [
        260.977,
        1.381,
        3.363,
        2.983
      ],
      "Cosmos-Edge": [
        563.858,
        1.564,
        6.397,
        4.312
      ]
    },
    {
      "precision": "W4A4",
      "method": "QuaRot",
      "Cosmos-Policy": [
        122.657,
        2.132,
        1.604,
        1.189
      ],
      "FastWAMJoint": [
        221.647,
        1.626,
        3.363,
        2.983
      ],
      "Cosmos-Edge": [
        569.943,
        1.547,
        6.396,
        4.312
      ]
    },
    {
      "precision": "W4A4",
      "method": "Atom",
      "Cosmos-Policy": [
        192.997,
        1.355,
        1.679,
        1.258
      ],
      "FastWAMJoint": [
        309.021,
        1.166,
        3.51,
        3.188
      ],
      "Cosmos-Edge": [
        766.027,
        1.151,
        6.463,
        4.361
      ]
    },
    {
      "precision": "W4A4",
      "method": "SVDQuant",
      "Cosmos-Policy": [
        131.093,
        1.994,
        1.755,
        1.321
      ],
      "FastWAMJoint": [
        348.767,
        1.033,
        3.756,
        3.371
      ],
      "Cosmos-Edge": [
        581.278,
        1.517,
        6.503,
        4.411
      ]
    },
    {
      "precision": "W4A4",
      "method": "SteerQuant",
      "Cosmos-Policy": [
        117.322,
        2.229,
        1.645,
        1.194
      ],
      "FastWAMJoint": [
        193.916,
        1.859,
        3.37,
        2.983
      ],
      "Cosmos-Edge": [
        521.589,
        1.69,
        6.398,
        4.314
      ]
    }
  ]
};
