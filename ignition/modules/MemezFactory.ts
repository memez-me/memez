import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MemezFactory = buildModule("MemezFactory", (m) => {
  const formula = m.contract("Formula", []);
  m.call(formula, "init");
  const memezFactory = m.contract("MemezFactory", [formula]);
  return { memezFactory };
});

export default MemezFactory;
