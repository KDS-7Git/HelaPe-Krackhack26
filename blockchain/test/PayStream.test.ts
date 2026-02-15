
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("PayStream", function () {
    async function deployPayStreamFixture() {
        const [owner, hr, employee, taxVault] = await ethers.getSigners();

        const MockHLUSD = await ethers.getContractFactory("MockHLUSD");
        const mockHLUSD = await MockHLUSD.deploy();

        // Distribute tokens to HR
        await mockHLUSD.transfer(hr.address, ethers.parseEther("10000"));

        const PayStream = await ethers.getContractFactory("PayStream");
        const payStream = await PayStream.deploy(await mockHLUSD.getAddress(), taxVault.address);

        return { payStream, mockHLUSD, owner, hr, employee, taxVault };
    }

    describe("Streaming", function () {
        it("Should allow creating a stream", async function () {
            const { payStream, mockHLUSD, hr, employee } = await loadFixture(deployPayStreamFixture);

            const deposit = ethers.parseEther("1000");
            const rate = ethers.parseEther("1"); // 1 token per second

            await mockHLUSD.connect(hr).approve(await payStream.getAddress(), deposit);

            await expect(payStream.connect(hr).createStream(employee.address, rate, deposit))
                .to.emit(payStream, "StreamCreated")
                .withArgs(0, hr.address, employee.address, rate, deposit);
        });

        it("Should allow withdrawal with tax", async function () {
            const { payStream, mockHLUSD, hr, employee, taxVault } = await loadFixture(deployPayStreamFixture);

            const deposit = ethers.parseEther("1000");
            const rate = ethers.parseEther("10");

            await mockHLUSD.connect(hr).approve(await payStream.getAddress(), deposit);
            await payStream.connect(hr).createStream(employee.address, rate, deposit);

            // Fast forward time
            await ethers.provider.send("evm_increaseTime", [10]);
            await ethers.provider.send("evm_mine", []);

            // 10 seconds * 10 tokens = 100 tokens vested.
            // 10% tax = 10 tokens.
            // Employee gets 90 tokens.

            await expect(payStream.connect(employee).withdraw(0))
                .to.emit(payStream, "Withdrawn")
                .withArgs(0, employee.address, ethers.parseEther("90"), ethers.parseEther("10"));

            expect(await mockHLUSD.balanceOf(taxVault.address)).to.equal(ethers.parseEther("10"));
            expect(await mockHLUSD.balanceOf(employee.address)).to.equal(ethers.parseEther("90"));
        });
    });
});
