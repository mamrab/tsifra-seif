// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "TsifraSafe",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(
            name: "TsifraSafeKit",
            targets: ["TsifraSafeKit"]
        )
    ],
    dependencies: [],
    targets: [
        .target(
            name: "TsifraSafeKit",
            dependencies: [],
            path: "TsifraSafe"
        )
    ]
)
