import type { Metadata } from "next";
import SocialsClient from "./SocialsClient";
import JoinCommunity from "@/components/content/JoinCommunity";

export const metadata: Metadata = {
    title: "Join the WBJEE Community | Discord & Reddit",
    description: "Connect with the largest community of WBJEE aspirants on Reddit and Discord. Get real-time help, share study resources, and find support from seniors.",
    alternates: {
        canonical: '/socials',
    },
    openGraph: {
        title: "Join the r/wbjee Community",
        description: "Connect with WBJEE aspirants on Reddit and Discord.",
        url: "https://www.rwbjee.com/socials",
        siteName: "rwbjee",
        type: "website",
        images: [
            {
                url: "/assets/images/og-image.svg",
                width: 1200,
                height: 630,
                alt: "r/wbjee Community",
            },
        ],
    }
};

export default async function SocialsPage() {
    return (
        <SocialsClient>
            <JoinCommunity />
        </SocialsClient>
    );
}