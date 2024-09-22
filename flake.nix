{
  description = "Pack-it-Easy Flake for the Server.";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = inputs @ {flake-parts, ...}:
    flake-parts.lib.mkFlake {inherit inputs;} {
      systems = ["x86_64-linux" "aarch64-linux" "aarch64-darwin" "x86_64-darwin"];

      perSystem = {
        config,
        self',
        inputs',
        pkgs,
        system,
        ...
      }: let
        name = "Pack-It-Easy";
        version = "latest";
        vendorHash = null;
      in {
        devShells = {
          default = pkgs.mkShell {
            inputsFrom = [self'.packages.default];
          };
        };

        packages = {
          default = pkgs.buildGoModule {
            inherit name vendorHash;
            src = ./.;
            subPackages = ["cmd/server"];
            ldflags = ["-s" "-w"];
          };
        };
      };
    };
}
