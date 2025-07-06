# DAOversity - A World ID Powered DAO Platform

DAOversity is a modern, decentralized application that allows users to create, join, and participate in Decentralized Autonomous Organizations (DAOs). It leverages World ID to ensure a fair and Sybil-resistant governance model, where every user is a unique human, guaranteeing a "one person, one vote" system.

![DAOversity Screenshot](public/images/screenshot.png) 

## ✨ Features

- **Human-First Governance**: Integrates World ID to verify that every user is a real, unique individual, preventing bots and fake accounts.
- **Wallet Authentication**: Securely connect with your Ethereum wallet to sign in and interact with the platform.
- **Create & Join DAOs**: Users can create their own DAOs with custom rules or join existing ones.
- **Proposal System**: Create and vote on proposals within a DAO.
- **User Profiles**: View your activity, DAOs you've joined, and proposals you've voted on.
- **Modern UI**: Built with Next.js, TypeScript, and shadcn/ui for a beautiful and responsive user experience.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Identity Protocol**: [World ID](https://worldcoin.org/world-id)
- **Web3**: [Viem](httpss://viem.sh/), [NextAuth.js](https://next-auth.js.org/)

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [pnpm](https://pnpm.io/) (or npm/yarn)
- A [World ID](https://developer.worldcoin.org/) application ID and action ID.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/EgeUnlu35/ETH_Daoversity.git
    cd ETH_Daoversity/my-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a file named `.env.local` in the `my-app` directory and add the following variables. You need to get your `APP_ID` and `ACTION_ID` from the [Worldcoin Developer Portal](https://developer.worldcoin.org/).

    ```env
    # World ID Application ID from developer.worldcoin.org
    NEXT_PUBLIC_WLD_APP_ID=
    
    # World ID Action ID from developer.worldcoin.org
    NEXT_PUBLIC_WLD_ACTION_ID=

    # NextAuth.js secret for session encryption (generate one here: https://generate-secret.vercel.app/)
    NEXTAUTH_SECRET=

    # The URL of your application
    NEXTAUTH_URL=http://localhost:3000
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. You will need to use a mobile simulator with the World App installed to test the World ID functionality.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/EgeUnlu35/ETH_Daoversity/issues).

## 📄 License

This project is licensed under the MIT License.

## World ID Verification Setup

This application uses World ID verification via the Worldcoin Mini App. To set it up:

1. Create an account on the [Worldcoin Developer Portal](https://developer.worldcoin.org/)
2. Create a new App in the Developer Portal
3. Create a new "Incognito Action" within your app for the verification
   - Incognito Actions are a primitive of World ID and allow you to gate functionality behind a unique human check
   - You can limit the number of times a user can perform an action
4. Copy your app ID and update the `.env.local` file:
   ```
   NEXT_PUBLIC_WLD_APP_ID="app_YOUR_MINI_APP_ID_HERE"
   NEXT_PUBLIC_WLD_ACTION_ID="tute-claim-action" # Or your custom action ID
   ```
5. Make sure you have the World App installed on your device to test the verification flow

### Implementation Details

The verification flow is triggered when clicking the "Verify to Claim" button, which will:

1. Open the World App for verification
2. Prompt the user to confirm the verification
3. Send the proof to the backend for verification
4. Upon successful verification, allow the user to claim TUTE tokens

#### Event-Based Approach

This implementation uses the event-based approach as recommended in the World ID documentation:

1. We use `MiniKit.commands.verify()` instead of the async version to initiate the verification
2. Event listeners are set up to handle the verification result:
   ```javascript
   document.addEventListener("miniapp-verify-action-success", handleSuccess);
   document.addEventListener("miniapp-verify-action-error", handleError);
   ```
3. When a successful verification event is received, we then verify the proof on the backend

This follows the exact implementation guidelines from the [World ID Verify Command documentation](https://docs.world.org/mini-apps/commands/verify).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

To learn more about World ID and Mini Apps:

- [World ID Documentation](https://docs.world.org/)
- [Mini Apps Quick Start](https://docs.world.org/mini-apps/quick-start)
- [Verify Command Documentation](https://docs.world.org/mini-apps/commands/verify)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
