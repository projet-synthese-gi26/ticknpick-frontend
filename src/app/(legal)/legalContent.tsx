// src/app/(legal)/legalContent.tsx
import React, { ReactElement } from 'react';

// Interface pour définir la structure de chaque document légal
interface LegalContent {
  title: string;
  lastUpdated: string;
  content: () => ReactElement;
}

// Collection de tous les documents légaux, indexés par leur "slug" d'URL
export const legalDocs: Record<string, LegalContent> = {
  
  // ===================================
  // == Conditions Générales d'Utilisation
  // ===================================
  'terms-of-use': {
    title: "Conditions Générales d'Utilisation",
    lastUpdated: "25 Mai 2024",
    content: () => (
      <>  
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold">TiiBnTick — Terms of Use / Conditions d’Utilisation</h2>
        <p className="text-md mt-2">Version 2.0 — 02 Sep 2025</p>
        <p className="text-sm text-gray-600 mt-1"><strong>Service Owner:</strong> Yowyob Inc. Ltd. ("Yowyob", "TiiBnTick", "we", "us")</p>
        <p className="text-sm text-gray-600"><strong>Scope:</strong> All TiiBnTick web and mobile properties, pre‑production and production environments, and related APIs/SDKs.</p>
      </div>

      <hr className="my-8" />

      {/* PARTIE I - ANGLAIS */}
      <div>
        <h2 className="text-2xl font-bold mb-4">PART I — ENGLISH (Standalone)</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3">1. Acceptance of Terms</h3>
        <p>By accessing or using TiiBnTick (including web, iOS/Android apps, and APIs), you agree to these Terms. If you do not agree, do not use the Services. We may amend these Terms; material changes will be notified in‑app, by banner, or by email. Continued use constitutes acceptance of changes.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">2. The Services (Summary)</h3>
        <p>TiiBnTick enables on‑demand pickup and delivery facilitation, shipment tracking, status notifications, and related features (e.g., address/landmark assistance, proof‑of‑pickup/delivery uploads). Certain features may be offered in beta and may change or be withdrawn at any time. Availability may vary by region and device.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">3. Accounts & Eligibility</h3>
        <p>You must be at least the age of majority in your jurisdiction (or have verifiable guardian consent where permitted). You are responsible for the security of your credentials and for all actions under your account. We may require identity verification for higher‑risk features (e.g., driver/courier onboarding) and may suspend/terminate accounts in case of suspected abuse or legal non‑compliance.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">4. Acceptable Use</h3>
        <p>You agree not to misuse the Services, including by:</p>
        <ul className="list-disc list-inside space-y-2 pl-4">
            <li>(i) reverse‑engineering, scraping, automated access beyond permitted API usage;</li>
            <li>(ii) uploading malware, illegal, hateful, fraudulent or infringing content;</li>
            <li>(iii) interfering with security or access controls;</li>
            <li>(iv) misrepresenting identity, goods, or services;</li>
            <li>(v) violating applicable laws (transport, customs, sanctions, anti‑bribery, privacy, consumer, and traffic regulations).</li>
        </ul>
        <p className="mt-2">We may remove content or restrict access for violations.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">5. Content, IP & Limited License</h3>
        <p><strong>Our IP.</strong> The Services and all materials (interfaces, text, graphics, logos, trademarks, databases, code) are owned by or licensed to Yowyob and are protected by IP laws.</p>
        <p className="mt-2"><strong>Limited License to You.</strong> We grant you a revocable, non‑exclusive, non‑transferable license to access and use the Services for your personal or internal business purposes in accordance with these Terms. You may not modify, reproduce, distribute, publicly display, create derivative works, or use our trademarks except as expressly permitted in writing.</p>
        <p className="mt-2"><strong>Your Content.</strong> You retain ownership of content you submit (e.g., shipment descriptions, addresses, photos). You grant Yowyob a worldwide, royalty‑free license to host, process, transmit, display and use such content to operate and improve the Services. You represent that you have the rights to submit such content and that it is lawful and accurate.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">6. Authorization to Reproduce (Website Materials)</h3>
        <p>You may copy limited portions of the website content for information and non‑commercial purposes only, provided that:</p>
        <ul className="list-disc list-inside space-y-2 pl-4">
            <li>(a) you do not modify the materials;</li>
            <li>(b) you do not remove or alter copyright/trademark notices; and</li>
            <li>(c) you include an appropriate copyright notice referring to Yowyob Inc. Ltd.</li>
        </ul>
        <p className="mt-2">Any other use requires our prior written permission.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">7. Interactive Features & Tracking</h3>
        <p>Interactive features (e.g., tracking, comments, proof‑of‑pickup/delivery) are provided for your convenience. You may use them solely for the stated purposes and in compliance with these Terms. Tracking and status information may be informational and subject to delays; it does not by itself constitute a contractual commitment of delivery time.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">8. Accuracy, Updates & Availability</h3>
        <p>We use reasonable efforts to keep information current, but the Services may contain inadvertent inaccuracies or typographical errors and may be updated without notice. Service availability can be affected by maintenance windows, network conditions, or third‑party providers. We reserve the right to modify or discontinue any feature at any time.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">9. Security & Viruses</h3>
        <p>We use security measures to protect the Services, but we cannot guarantee that the Services or files available for download are free of viruses or other harmful components. You are responsible for implementing adequate protections (e.g., anti‑virus, backups) before downloading or uploading materials.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">10. Privacy & Cookies</h3>
        <p>Use of the Services is subject to our Privacy Policy and Cookie Policy. Where required, we obtain your consent for non‑essential cookies/SDKs and for mobile advertising identifiers (IDFA/GAID). For iOS, we respect App Tracking Transparency (ATT).</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">11. Payments, Fees & Refunds (if applicable)</h3>
        <p>Pricing, fees, and taxes (including VAT or local indirect taxes) will be shown or made available before you confirm a transaction. Refund and cancellation windows may vary by product or partner. Certain transactions (e.g., mobile money) may be processed by third‑party providers; their terms may apply.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">12. Third‑Party Providers & Links</h3>
        <p>The Services may integrate or link to third‑party services (e.g., maps, payment gateways, logistics partners). These providers are responsible for their own services and terms. We are not liable for third‑party acts/omissions, websites, or content.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">13. Disclaimer of Warranties</h3>
        <p>THE SERVICES AND ALL MATERIALS ARE PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING, WITHOUT LIMITATION, WARRANTIES OF MERCHANTABILITY, NON‑INFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE. Your statutory rights that cannot be waived are not affected.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">14. Limitation of Liability</h3>
        <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, YOWYOB AND ITS AFFILIATES/LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, PUNITIVE OR CONSEQUENTIAL DAMAGES, OR LOSS OF PROFITS, DATA, GOODWILL, OR BUSINESS INTERRUPTION, ARISING OUT OF OR RELATED TO YOUR USE OF (OR INABILITY TO USE) THE SERVICES.</p>
        <p className="mt-2">Subject to the foregoing and where permitted, Yowyob’s aggregate liability for all claims in the aggregate shall not exceed the amounts you paid to Yowyob in the 12 months preceding the event giving rise to the claim, or EUR 100 (or equivalent) if no amounts were paid.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">15. Indemnification</h3>
        <p>You agree to indemnify and hold harmless Yowyob and its officers, employees, and partners from claims, damages, liabilities, costs and expenses (including reasonable legal fees) arising from your misuse of the Services, your content, or your violation of these Terms or applicable laws.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">16. Compliance, Sanctions & Export</h3>
        <p>You represent that you are not subject to embargoes or sanctions that would prohibit use of the Services and that you will comply with applicable export control, sanctions, anti‑corruption and anti‑money‑laundering laws.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">17. Force Majeure</h3>
        <p>We shall not be liable for delays or failures caused by events beyond our reasonable control, including outages of public networks, power failures, strikes, acts of God, or regulatory actions.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">18. Termination</h3>
        <p>You may stop using the Services at any time and request account deactivation. We may suspend or terminate access for any breach, suspected fraud, legal/regulatory risk, or prolonged inactivity. On termination, certain provisions survive (e.g., IP, warranties, liability limits, governing law).</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">19. Governing Law & Disputes</h3>
        <p>Unless a mandatory local law provides otherwise, these Terms are governed by the laws of Cameroon, and disputes shall be subject to the courts of Yaoundé after a 30‑day mandatory mediation phase. Consumers may also have access to local dispute resolution bodies where available.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">20. App Stores</h3>
        <p>If you obtained the app from an app store (e.g., Apple App Store, Google Play), the store provider is not a party to these Terms and has no warranty or support obligations. You must comply with the applicable store terms.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">21. Miscellaneous</h3>
        <p>Entire Agreement; Severability; No Waiver; Assignment (you may not assign without consent; we may assign to an affiliate or in a merger or asset transfer); Notices (electronic communications acceptable); Language (English and French versions published; in case of conflict, a controlling language may be specified by region); Headings are for convenience only.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">22. Contact</h3>
        <p>Yowyob Inc. Ltd — Legal<br />S/C 8390, Yaoundé, Cameroon<br />Email: legal@yowyob.com / support@yowyob.com</p>
      </div>

      <hr className="my-8" />

      {/* PARTIE II - FRANÇAIS */}
      <div>
        <h2 className="text-2xl font-bold mb-4">PART II — FRANÇAIS (Autonome)</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3">1. Acceptation des Conditions</h3>
        <p>En accédant ou en utilisant TiiBnTick (web, apps iOS/Android et API), vous acceptez les présentes Conditions. Si vous n’êtes pas d’accord, n’utilisez pas les Services. Nous pouvons modifier ces Conditions ; les changements importants seront notifiés dans l’app, par bannière ou par e‑mail. Votre utilisation continue vaut acceptation des modifications.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">2. Les Services (Résumé)</h3>
        <p>TiiBnTick permet la facilitation d’enlèvements et de livraisons à la demande, le suivi des envois, les notifications d’état et des fonctionnalités associées (ex. assistance adresse/repère, preuves d’enlèvement/livraison). Certaines fonctions peuvent être proposées en bêta et évoluer ou être retirées. La disponibilité varie selon la région et l’appareil.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">3. Comptes & Éligibilité</h3>
        <p>Vous devez avoir l’âge légal de votre juridiction (ou l’accord d’un tuteur lorsque autorisé). Vous êtes responsable de la sécurité de vos identifiants et des actions réalisées depuis votre compte. Une vérification d’identité peut être requise pour des fonctions à risque (ex. onboarding chauffeur/coursier). Nous pouvons suspendre/résilier un compte en cas d’abus présumé ou de non‑conformité légale.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">4. Bon Usage</h3>
        <p>Interdictions :</p>
        <ul className="list-disc list-inside space-y-2 pl-4">
            <li>(i) rétro‑ingénierie, scraping, accès automatisé hors usage API autorisé ;</li>
            <li>(ii) dépôt de malware, de contenus illégaux, haineux, frauduleux ou contrefaisants ;</li>
            <li>(iii) atteinte aux mesures de sécurité ;</li>
            <li>(iv) usurpation d’identité, fausse description de marchandises ou services ;</li>
            <li>(v) violation de lois applicables (transport, douanes, sanctions, anti‑corruption, vie privée, consommation, circulation routière).</li>
        </ul>
        <p className="mt-2">Nous pouvons supprimer des contenus ou restreindre l’accès en cas de violation.</p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">5. Contenus, PI & Licence limitée</h3>
        <p><strong>Notre PI.</strong> Les Services et matériels (interfaces, textes, graphismes, logos, marques, bases de données, code) appartiennent à Yowyob ou à ses concédants et sont protégés par le droit de la propriété intellectuelle.</p>
        <p className="mt-2"><strong>Licence limitée.</strong> Nous vous concédons une licence révocable, non exclusive et non transférable pour accéder et utiliser les Services à des fins personnelles ou internes, conformément aux présentes. Vous ne pouvez pas modifier, reproduire, distribuer, afficher publiquement, créer des œuvres dérivées ni utiliser nos marques, sauf autorisation écrite.</p>
        <p className="mt-2"><strong>Vos contenus.</strong> Vous conservez la propriété des contenus fournis (ex. descriptions d’envois, adresses, photos). Vous accordez à Yowyob une licence mondiale, gratuite pour héberger, traiter, transmettre, afficher et utiliser ces contenus afin d’exploiter et d’améliorer les Services. Vous déclarez disposer des droits nécessaires et que ces contenus sont licites et exacts.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">6. Autorisation de reproduction (site web)</h3>
        <p>Vous pouvez copier des portions limitées du contenu du site à des fins d’information et non commerciales uniquement, à condition :</p>
        <ul className="list-disc list-inside space-y-2 pl-4">
            <li>(a) de ne pas modifier le contenu ;</li>
            <li>(b) de ne pas retirer/altérer les mentions de droits d’auteur/marques ;</li>
            <li>(c) d’inclure une notice de copyright appropriée renvoyant à Yowyob Inc. Ltd.</li>
        </ul>
        <p className="mt-2">Tout autre usage requiert notre accord écrit préalable.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">7. Fonctionnalités interactives & Suivi</h3>
        <p>Les fonctionnalités interactives (ex. suivi, commentaires, preuves d’enlèvement/livraison) sont fournies pour votre commodité. Vous ne pouvez les utiliser que aux fins prévues et dans le respect des présentes. Les informations de suivi et d’état sont indicatives et susceptibles de délais ; elles ne constituent pas en soi un engagement contractuel de délai.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">8. Exactitude, mises à jour & disponibilité</h3>
        <p>Nous faisons des efforts raisonnables pour maintenir les informations à jour, mais les Services peuvent contenir des inexactitudes involontaires ou des erreurs typographiques et être mis à jour sans préavis. La disponibilité peut être affectée par des maintenances, les réseaux ou des prestataires tiers. Nous pouvons modifier ou retirer une fonctionnalité à tout moment.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">9. Sécurité & Virus</h3>
        <p>Nous mettons en œuvre des mesures de sécurité, sans garantie que les Services ou les fichiers téléchargeables soient exempts de virus ou composants nuisibles. À vous de mettre en place des protections adéquates (antivirus, sauvegardes) avant tout téléchargement ou dépôt de fichiers.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">10. Vie privée & Cookies</h3>
        <p>L’utilisation des Services est soumise à notre Politique de confidentialité et à notre Politique Cookies. Lorsque requis, nous recueillons votre consentement pour les cookies/SDK non essentiels et pour les identifiants publicitaires mobiles (IDFA/GAID). Sous iOS, nous respectons App Tracking Transparency (ATT).</p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">11. Paiements, frais & remboursements (le cas échéant)</h3>
        <p>Les prix, frais et taxes (y compris TVA ou taxes locales) sont affichés ou communiqués avant confirmation. Les délais d’annulation/remboursement varient selon le produit ou le partenaire. Certaines opérations (ex. mobile money) sont traitées par des prestataires tiers ; leurs conditions peuvent s’appliquer.</p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">12. Prestataires tiers & Liens</h3>
        <p>Les Services peuvent intégrer ou renvoyer vers des services tiers (cartographie, paiement, partenaires logistiques). Ces prestataires sont responsables de leurs services et conditions. Nous ne sommes pas responsables de leurs actes/omissions, sites ou contenus.</p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">13. Exclusions de garanties</h3>
        <p>LES SERVICES ET TOUS LES CONTENUS SONT FOURNIS « EN L’ÉTAT » ET « SELON DISPONIBILITÉ », SANS AUCUNE GARANTIE, EXPRESSE OU IMPLICITE, Y COMPRIS LES GARANTIES DE QUALITÉ MARCHANDE, D’ABSENCE DE CONTREFAÇON ET D’ADÉQUATION À UN USAGE PARTICULIER. Vos droits légaux impératifs ne sont pas affectés.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">14. Limitation de responsabilité</h3>
        <p>DANS LA MESURE AUTORISÉE PAR LA LOI, YOWYOB ET SES AFFILIÉS/CONCÉDANTS NE SAURONT ÊTRE TENUS RESPONSABLES DES DOMMAGES INDIRECTS, SPÉCIAUX, PUNITIFS OU CONSÉCUTIFS, NI DES PERTES DE PROFITS, DE DONNÉES, DE CLIENTÈLE OU D’EXPLOITATION, LIÉS À L’UTILISATION (OU L’IMPOSSIBILITÉ D’UTILISATION) DES SERVICES.</p>
        <p className="mt-2">Sous réserve de ce qui précède et lorsque permis, la responsabilité totale de Yowyob ne dépassera pas les montants versés à Yowyob sur les 12 mois précédant l’événement à l’origine de la réclamation, ou 100 EUR (ou équivalent) si aucun montant n’a été versé.</p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">15. Indemnisation</h3>
        <p>Vous acceptez de garantir et d’indemniser Yowyob, ses dirigeants, employés et partenaires contre toute réclamation, dommage, responsabilité, coût et dépense (y compris frais raisonnables d’avocat) résultant d’un mauvais usage des Services, de vos contenus ou d’une violation des présentes ou des lois applicables.</p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">16. Conformité, Sanctions & Export</h3>
        <p>Vous déclarez ne pas être soumis à un embargo ou à des sanctions interdisant l’usage des Services et respecter les lois contrôle des exportations, sanctions, anti‑corruption et lutte contre le blanchiment applicables.</p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">17. Force majeure</h3>
        <p>Nous ne serons pas responsables des retards ou manquements dus à des événements hors de notre contrôle raisonnable (pannes réseau publiques, coupures d’électricité, grèves, catastrophes naturelles, décisions administratives).</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">18. Résiliation</h3>
        <p>Vous pouvez cesser d’utiliser les Services à tout moment et demander la désactivation de votre compte. Nous pouvons suspendre/résilier l’accès en cas de violation, fraude présumée, risque légal/réglementaire ou inactivité prolongée. Certaines clauses survivent (PI, garanties, limites, loi applicable).</p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">19. Droit applicable & Litiges</h3>
        <p>Sauf loi impérative contraire, les présentes sont régies par le droit camerounais, et les litiges sont soumis aux tribunaux de Yaoundé après une médiation obligatoire de 30 jours. Les consommateurs peuvent avoir accès à des dispositifs locaux de règlement amiable.</p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">20. Boutiques d’applications</h3>
        <p>Si vous avez obtenu l’app via une boutique (Apple App Store, Google Play), la boutique n’est pas partie aux présentes et n’a pas d’obligations de garantie/assistance. Vous devez respecter les conditions de la boutique concernée.</p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">21. Dispositions diverses</h3>
        <p>Intégralité de l’accord ; divisibilité ; absence de renonciation ; cession (vous ne pouvez pas céder sans consentement ; nous pouvons céder à une affiliée ou dans le cadre d’une fusion/cession d’actifs) ; notifications (communications électroniques admises) ; langue (versions anglaise et française publiées ; en cas de conflit, une langue de référence peut être précisée par région) ; titres à valeur indicative.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">22. Contact</h3>
        <p>Yowyob Inc. Ltd — Juridique<br />S/C 8390, Yaoundé, Cameroun<br />E‑mail : legal@yowyob.com / support@yowyob.com</p>
      </div>

      </>
    )
  },
  
  // ===================================
  // == Politique de Confidentialité
  // ===================================
  'privacy-policy': {
    title: "Politique de Confidentialité et de Données",
    lastUpdated: "25 Mai 2024",
    content: () => (
      <>
        <h1 className="text-3xl font-bold mb-2">Yowyob TiiBnTick — Privacy & Data Policy / Politique de confidentialité & des données</h1>
        <p className="text-md text-gray-600">Version 3.0 — 02 Sep 2025</p>
        <p className="text-md text-gray-600 mb-6">Service Owner: Yowyob Inc. Ltd. ("TiiBnTick", "we", "us")</p>
        
        <hr className="my-8" />

        {/* PART I — ENGLISH */}
        <div id="english-policy">
          <h2 className="text-2xl font-bold mt-8 mb-4">PART I — ENGLISH (Standalone)</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">1) Who we are & scope</h3>
          <p>This Privacy & Data Policy explains how TiiBnTick collects, uses, shares and protects personal data across our websites, mobile apps, APIs/SDKs and related services. It applies to customers, recipients, couriers/drivers, business partners and site/app visitors.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">2) Personal data we collect (by category)</h3>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li><strong>Identity & contact:</strong> name, email, phone, address, organization, national ID/passport/driver’s licence (for KYC where applicable).</li>
            <li><strong>Account & authentication:</strong> username, hashed credentials, role/permissions, logs (sign‑in, 2FA).</li>
            <li><strong>Shipment & service data:</strong> pickup/delivery addresses and landmarks, parcel details, instructions, proof‑of‑pickup/delivery (photos, signatures).</li>
            <li><strong>Payments:</strong> amount, currency, method (masked card/mobile‑money), payment status; no full card storage on our servers (handled by certified processors).</li>
            <li><strong>Device & usage:</strong> IP, device identifiers, OS/app version, crash logs, events, language/locale.</li>
            <li><strong>Location:</strong> GPS/Wi‑Fi/cell‑tower signals for features like live courier ETA and route optimisation (opt‑in where required).</li>
            <li><strong>Cookies & similar tech:</strong> see our Cookie Policy (categories, purposes, consent controls).</li>
            <li><strong>Communications:</strong> messages with Support, email/SMS/push delivery of status updates.</li>
            <li><strong>Fraud & security signals:</strong> rate‑limit counters, anomaly scores, account risk indicators.</li>
          </ul>
          <p className="mt-4"><strong>Sources:</strong> data you provide; data collected automatically by our services; data from partners (e.g., payments, maps, address validation), and where permitted, public/3rd‑party sources (e.g., KYC/AML checks for drivers/merchants).</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">3) Why we use data — purposes & legal bases</h3>
          <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                  <thead>
                      <tr className="bg-gray-100 dark:bg-gray-900">
                          <th className="border border-gray-300 p-2 text-left">Purpose</th>
                          <th className="border border-gray-300 p-2 text-left">Examples</th>
                          <th className="border border-gray-300 p-2 text-left">Legal bases (where applicable)</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr>
                          <td className="border border-gray-300 p-2">Provide & improve Services</td>
                          <td className="border border-gray-300 p-2">account setup, pickup/delivery, tracking, notifications, customer support</td>
                          <td className="border border-gray-300 p-2">Contract; Legitimate interest</td>
                      </tr>
                      <tr>
                          <td className="border border-gray-300 p-2">Safety, security & fraud prevention</td>
                          <td className="border border-gray-300 p-2">identity checks (drivers), access controls, abuse detection, chargeback prevention</td>
                          <td className="border border-gray-300 p-2">Legitimate interest; Legal obligation</td>
                      </tr>
                      <tr>
                          <td className="border border-gray-300 p-2">Payments</td>
                          <td className="border border-gray-300 p-2">process fees, refunds, receipts</td>
                          <td className="border border-gray-300 p-2">Contract; Legal obligation</td>
                      </tr>
                      <tr>
                          <td className="border border-gray-300 p-2">Personalisation & convenience</td>
                          <td className="border border-gray-300 p-2">saved addresses, language/locale, last tracking reference</td>
                          <td className="border border-gray-300 p-2">Legitimate interest; Consent (EEA/UK for non‑essential)</td>
                      </tr>
                      <tr>
                          <td className="border border-gray-300 p-2">Analytics & diagnostics</td>
                          <td className="border border-gray-300 p-2">usage metrics, crash reporting, quality monitoring</td>
                          <td className="border border-gray-300 p-2">Consent (EEA/UK); Legitimate interest (elsewhere, where permitted)</td>
                      </tr>
                      <tr>
                          <td className="border border-gray-300 p-2">Marketing & communications</td>
                          <td className="border border-gray-300 p-2">service announcements, offers/surveys</td>
                          <td className="border border-gray-300 p-2">Consent where required; Legitimate interest (opt‑out available)</td>
                      </tr>
                      <tr>
                          <td className="border border-gray-300 p-2">Legal & compliance</td>
                          <td className="border border-gray-300 p-2">tax, accounting, law enforcement requests</td>
                          <td className="border border-gray-300 p-2">Legal obligation</td>
                      </tr>
                  </tbody>
              </table>
          </div>

          <h3 className="text-xl font-semibold mt-6 mb-3">4) Sharing — categories of recipients</h3>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>Logistics & delivery partners (only data needed to fulfill the shipment).</li>
            <li>Payment providers & anti‑fraud partners.</li>
            <li>Technology vendors (hosting, analytics/diagnostics, maps, communications).</li>
            <li>Affiliates within Yowyob group in line with this Policy.</li>
            <li>Authorities & dispute resolution bodies when required by law or to protect rights.</li>
          </ul>
          <p className="mt-4">We do not sell your personal data for commercial purposes.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">5) International transfers</h3>
          <p>We may transfer data to countries outside your own for hosting, support and processing. Where required, we use recognized safeguards (e.g., Standard Contractual Clauses and contractual protections). Our approach aligns with group‑wide privacy standards and binding rules used by leading logistics organisations.</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">6) Retention — how long we keep data</h3>
          <p>We keep data only as long as needed for the purposes below, legal obligations, or dispute resolution. Typical windows:</p>
          <div className="overflow-x-auto mt-4">
              <table className="w-full border-collapse border border-gray-300">
                  <thead>
                      <tr className="bg-gray-100 dark:bg-gray-900">
                          <th className="border border-gray-300 p-2 text-left">Data category</th>
                          <th className="border border-gray-300 p-2 text-left">Typical retention</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr>
                          <td className="border border-gray-300 p-2">Account (active)</td>
                          <td className="border border-gray-300 p-2">For the life of the account</td>
                      </tr>
                      <tr>
                          <td className="border border-gray-300 p-2">Inactive account basics</td>
                          <td className="border border-gray-300 p-2">36 months after last activity, then deletion/anonymisation</td>
                      </tr>
                      <tr>
                          <td className="border border-gray-300 p-2">Shipment records & PoD</td>
                          <td className="border border-gray-300 p-2">24–36 months (operations, tax/audit, fraud defence)</td>
                      </tr>
                      <tr>
                          <td className="border border-gray-300 p-2">Payments/Invoices</td>
                          <td className="border border-gray-300 p-2">10 years where tax law requires, else 5–7 years</td>
                      </tr>
                      <tr>
                          <td className="border border-gray-300 p-2">Security logs (access, auth)</td>
                          <td className="border border-gray-300 p-2">12–24 months</td>
                      </tr>
                      <tr>
                          <td className="border border-gray-300 p-2">Analytics events</td>
                          <td className="border border-gray-300 p-2">14 months (or shorter in EEA/UK)</td>
                      </tr>
                      <tr>
                          <td className="border border-gray-300 p-2">Customer Support tickets</td>
                          <td className="border border-gray-300 p-2">24 months</td>
                      </tr>
                  </tbody>
              </table>
          </div>

          <h3 className="text-xl font-semibold mt-6 mb-3">7) Cookies & similar technologies</h3>
          <p>We use a consent banner with category toggles and a persistent “Cookie Settings” link. See the Cookie Policy for categories, examples and controls (web and in-app). Mobile SDKs honour Android GAID and iOS ATT/IDFA choices.</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">8) Your privacy controls & rights</h3>
          <p>Depending on your location, you may have rights to access, rectify, erase, restrict, object, and port your data. You can manage marketing preferences and withdraw consent at any time (does not affect prior processing). We will verify identity before fulfilling requests. Response times follow applicable law (e.g., 1 month in EEA/UK; reasonable period in other regions).</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">9) Security</h3>
          <p>We implement TLS 1.3 in transit, encryption at rest (AES‑256), strong access controls, least‑privilege, regular audits, backup & recovery, and vendor due diligence. No method is 100% secure; you should also protect your account and devices.</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">10) Children</h3>
          <p>Our Services are not directed to children under 13 (or local equivalent). We do not knowingly collect children’s data without parental consent.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">11) Automated decisions & profiling</h3>
          <p>We may use automated systems to detect fraud/abuse or estimate delivery ETAs. These do not produce legal effects about you without human review where required by law.</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">12) Changes to this Policy</h3>
          <p>We may update this Policy to reflect technical, regulatory or business changes. Material updates will be notified (banner, in‑app, or email). The version/date above indicates the latest revision.</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">13) Contact</h3>
          <div className="space-y-1">
              <p>Data Protection Officer — Yowyob Inc. Ltd</p>
              <p>S/C 8390, Yaoundé, Cameroon</p>
              <p><strong>Email:</strong> privacy@yowyob.com / info@yowyob.com</p>
              <p><strong>Phone:</strong> +237 675 518 880 / +237 656 168 129</p>
              <p><strong>Regulator (Cameroon):</strong> ANTIC — Agence Nationale des TIC (or your local authority).</p>
          </div>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Annex A — Regional supplements</h3>
          <ul className="list-disc list-inside space-y-2 pl-4">
              <li><strong>EEA/UK:</strong> consent required for non‑essential cookies/SDKs; cross‑border transfers protected by SCCs; rights per GDPR (access, rectification, deletion, restriction, portability, objection).</li>
              <li><strong>Cameroon & CEMAC:</strong> processing aligned with Law 2010/012 and applicable CEMAC rules; rights include access/rectification/objection; regulator ANTIC.</li>
              <li><strong>Other regions:</strong> we apply local rules; where rules are absent, we apply baseline safeguards consistent with this Policy.</li>
          </ul>
        </div>

        <hr className="my-8" />
        
        {/* PART II — FRANÇAIS */}
        <div id="french-policy">
          <h2 className="text-2xl font-bold mt-8 mb-4">PART II — FRANÇAIS (Autonome)</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">1) Qui sommes‑nous & portée</h3>
          <p>La présente Politique de confidentialité & des données explique comment TiiBnTick collecte, utilise, partage et protège les données personnelles sur nos sites web, applications mobiles, API/SDK et services associés. Elle s’applique aux clients, destinataires, coursiers/chauffeurs, partenaires et visiteurs.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">2) Données personnelles collectées (par catégorie)</h3>
          <ul className="list-disc list-inside space-y-2 pl-4">
              <li><strong>Identité & contact :</strong> nom, e‑mail, téléphone, adresse, organisation, pièce d’identité/passeport/permis (KYC si applicable).</li>
              <li><strong>Compte & authentification :</strong> identifiant, empreinte de mot de passe, rôles/autorisations, journaux (connexion, 2FA).</li>
              <li><strong>Service & expéditions :</strong> adresses d’enlèvement/livraison et repères, détails de colis, instructions, preuves d’enlèvement/livraison (photos, signatures).</li>
              <li><strong>Paiements :</strong> montant, devise, méthode (carte/mobile‑money masquée), statut ; pas de stockage complet des cartes sur nos serveurs (prestataires certifiés).</li>
              <li><strong>Appareil & usage :</strong> IP, identifiants d’appareil, version OS/app, logs de plantage, événements, langue/locale.</li>
              <li><strong>Localisation :</strong> GPS/Wi‑Fi/cellules pour ETA et optimisation d’itinéraire (opt‑in lorsque requis).</li>
              <li><strong>Cookies & technologies similaires :</strong> voir notre Politique Cookies (catégories, finalités, consentement).</li>
              <li><strong>Communications :</strong> messages au Support, e‑mails/SMS/push sur l’état des envois.</li>
              <li><strong>Signaux fraude & sécurité :</strong> compteurs anti‑abus, scores d’anomalie, indicateurs de risque.</li>
          </ul>
          <p className="mt-4"><strong>Sources :</strong> données fournies par vous ; données collectées automatiquement par nos services ; données de partenaires (paiements, cartographie, validation d’adresse) ; et, si autorisé, sources publiques/tiers (vérifications KYC/AML pour chauffeurs/marchands).</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">3) Pourquoi nous utilisons ces données — finalités & bases légales</h3>
          <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                  <thead>
                      <tr className="bg-gray-100 dark:bg-gray-900">
                          <th className="border border-gray-300 p-2 text-left">Finalité</th>
                          <th className="border border-gray-300 p-2 text-left">Exemples</th>
                          <th className="border border-gray-300 p-2 text-left">Bases légales (selon région)</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr>
                          <td className="border border-gray-300 p-2">Fournir & améliorer les Services</td>
                          <td className="border border-gray-300 p-2">création de compte, enlèvement/livraison, suivi, notifications, assistance</td>
                          <td className="border border-gray-300 p-2">Contrat ; Intérêt légitime</td>
                      </tr>
                      <tr>
                          <td className="border border-gray-300 p-2">Sécurité & prévention fraude</td>
                          <td className="border border-gray-300 p-2">vérifs d’identité (chauffeurs), accès, détection d’abus, prévention des impayés</td>
                          <td className="border border-gray-300 p-2">Intérêt légitime ; Obligation légale</td>
                      </tr>
                      <tr>
                          <td className="border border-gray-300 p-2">Paiements</td>
                          <td className="border border-gray-300 p-2">traitement des frais, remboursements, reçus</td>
                          <td className="border border-gray-300 p-2">Contrat ; Obligation légale</td>
                      </tr>
                      <tr>
                          <td className="border border-gray-300 p-2">Personnalisation & confort</td>
                          <td className="border border-gray-300 p-2">adresses enregistrées, langue/locale, dernier numéro de suivi</td>
                          <td className="border border-gray-300 p-2">Intérêt légitime ; Consentement (EEE/RU pour non essentiels)</td>
                      </tr>
                      <tr>
                          <td className="border border-gray-300 p-2">Analytics & diagnostics</td>
                          <td className="border border-gray-300 p-2">métriques d’usage, crash reports, qualité de service</td>
                          <td className="border border-gray-300 p-2">Consentement (EEE/RU) ; Intérêt légitime (ailleurs, si permis)</td>
                      </tr>
                      <tr>
                          <td className="border border-gray-300 p-2">Marketing & communications</td>
                          <td className="border border-gray-300 p-2">annonces de service, offres/sondages</td>
                          <td className="border border-gray-300 p-2">Consentement si requis ; Intérêt légitime (opt‑out)</td>
                      </tr>
                      <tr>
                          <td className="border border-gray-300 p-2">Conformité légale</td>
                          <td className="border border-gray-300 p-2">fiscalité, comptabilité, demandes des autorités</td>
                          <td className="border border-gray-300 p-2">Obligation légale</td>
                      </tr>
                  </tbody>
              </table>
          </div>

          <h3 className="text-xl font-semibold mt-6 mb-3">4) Partage — catégories de destinataires</h3>
          <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Partenaires logistiques & de livraison (données strictement nécessaires).</li>
              <li>Prestataires de paiement & anti‑fraude.</li>
              <li>Fournisseurs technologiques (hébergement, analytics/diagnostic, cartographie, communications).</li>
              <li>Sociétés affiliées du groupe Yowyob, conformément à la présente Politique.</li>
              <li>Autorités & organismes de médiation si la loi l’exige ou pour la protection des droits.</li>
          </ul>
          <p className="mt-4">Nous ne vendons pas vos données personnelles à des fins commerciales.</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">5) Transferts internationaux</h3>
          <p>Nous pouvons transférer des données hors de votre pays pour l’hébergement, le support et le traitement. Lorsque requis, nous utilisons des garanties reconnues (p. ex. Clauses Contractuelles Types) et des protections contractuelles. Notre approche s’aligne sur des standards de groupe et des règles contraignantes de protection des données utilisées par les leaders du secteur logistique.</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">6) Conservation — durées indicatives</h3>
          <p>Nous conservons les données le temps nécessaire aux finalités ci‑dessus, aux obligations légales ou à la résolution de litiges :</p>
          <div className="overflow-x-auto mt-4">
              <table className="w-full border-collapse border border-gray-300">
                  <thead>
                      <tr className="bg-gray-100 dark:bg-gray-900">
                          <th className="border border-gray-300 p-2 text-left">Catégorie de données</th>
                          <th className="border border-gray-300 p-2 text-left">Durée type</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr>
                          <td className="border border-gray-300 p-2">Compte (actif)</td>
                          <td className="border border-gray-300 p-2">Pendant la vie du compte</td>
                      </tr>
                      <tr>
                          <td className="border border-gray-300 p-2">Éléments de compte inactif</td>
                          <td className="border border-gray-300 p-2">36 mois après dernière activité puis suppression/anonymisation</td>
                      </tr>
                      <tr>
                          <td className="border border-gray-300 p-2">Dossiers d’expédition & Preuves</td>
                          <td className="border border-gray-300 p-2">24–36 mois (opérations, fiscalité/audit, défense anti‑fraude)</td>
                      </tr>
                      <tr>
                          <td className="border border-gray-300 p-2">Paiements/Facturation</td>
                          <td className="border border-gray-300 p-2">10 ans si exigé par la loi fiscale, sinon 5–7 ans</td>
                      </tr>
                      <tr>
                          <td className="border border-gray-300 p-2">Journaux de sécurité (accès, auth)</td>
                          <td className="border border-gray-300 p-2">12–24 mois</td>
                      </tr>
                      <tr>
                          <td className="border border-gray-300 p-2">Événements analytics</td>
                          <td className="border border-gray-300 p-2">14 mois (ou moins en EEE/RU)</td>
                      </tr>
                      <tr>
                          <td className="border border-gray-300 p-2">Tickets Support</td>
                          <td className="border border-gray-300 p-2">24 mois</td>
                      </tr>
                  </tbody>
              </table>
          </div>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">7) Cookies & technologies similaires</h3>
          <p>Nous utilisons une bannière de consentement avec catégories et un lien persistant « Paramètres des cookies ». Voir la Politique Cookies pour les catégories, exemples et contrôles (web & in-app). Les SDK mobiles respectent GAID Android et ATT/IDFA iOS.</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">8) Vos droits & contrôles</h3>
          <p>Selon votre localisation, vous pouvez exercer vos droits d’accès, rectification, effacement, restriction, opposition et portabilité. Vous pouvez gérer vos préférences marketing et retirer votre consentement à tout moment (sans effet rétroactif). Nous vérifions l’identité avant de répondre. Délais : p. ex. 1 mois en EEE/RU ; délai raisonnable ailleurs.</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">9) Sécurité</h3>
          <p>Nous appliquons TLS 1.3 en transit, chiffrement au repos (AES‑256), contrôles d’accès stricts, moindre privilège, audits réguliers, sauvegarde & reprise, et diligence fournisseurs. Aucun moyen n’est infaillible ; protégez aussi votre compte et vos appareils.</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">10) Enfants</h3>
          <p>Les Services ne s’adressent pas aux moins de 13 ans (ou équivalent local). Nous ne collectons pas sciemment de données d’enfants sans consentement parental.</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">11) Décisions automatisées & profilage</h3>
          <p>Nous pouvons utiliser des systèmes automatisés pour détecter la fraude/l’abus ou estimer les ETA. Ils ne produisent pas d’effets juridiques sans intervention humaine lorsque la loi l’exige.</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">12) Mises à jour</h3>
          <p>Nous pouvons mettre à jour la présente Politique pour refléter des évolutions techniques, réglementaires ou de service. Les changements substantiels seront notifiés (bannière, in‑app ou e‑mail). La version/date ci‑dessus reflète la dernière révision.</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">13) Contact</h3>
          <div className="space-y-1">
              <p>Délégué à la protection des données — Yowyob Inc. Ltd</p>
              <p>S/C 8390, Yaoundé, Cameroun</p>
              <p><strong>E‑mail :</strong> privacy@yowyob.com / info@yowyob.com</p>
              <p><strong>Tél. :</strong> +237 675 518 880 / +237 656 168 129</p>
              <p><strong>Autorité (Cameroun) :</strong> ANTIC — Agence Nationale des TIC (ou l’autorité compétente de votre pays).</p>
          </div>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Annexe A — Modules régionaux</h3>
          <ul className="list-disc list-inside space-y-2 pl-4">
              <li><strong>EEE/Royaume‑Uni :</strong> consentement requis pour cookies/SDK non essentiels ; transferts transfrontaliers couverts par CCT ; droits RGPD (accès, rectification, effacement, restriction, portabilité, opposition).</li>
              <li><strong>Cameroun & CEMAC :</strong> traitement conforme à la Loi 2010/012 et règles CEMAC ; droits d’accès/rectification/opposition ; régulateur ANTIC.</li>
              <li><strong>Autres régions :</strong> application des règles locales ; en l’absence de règles, application de garanties minimales conformes à la présente Politique.</li>
          </ul>
        </div>
      </>
    )
  },

  // ===================================
  // == Politique de Cookies
  // ===================================
  'cookies-policy': {
    title: "Politique de Cookies",
    lastUpdated: "25 Mai 2024",
    content: () => (
      <>
        {/* En-tête du document */}
        <h2 className="text-2xl font-bold mb-2">Yowyob TiiBnTick — Politique sur les Cookies & Technologies Similaires</h2>
        <p className="text-sm text-gray-600 mb-1">Version 3.1 — 02 Sep 2025</p>
        <p className="text-sm text-gray-600 mb-6">Propriétaire du service : Yowyob Inc. Ltd. ("TiiBnTick", "nous").</p>
        
        {/* Contenu de la politique en français */}
        <h3 className="text-xl font-semibold mt-6 mb-3">1) Introduction</h3>
        <p>Le présent document explique comment TiiBnTick utilise des cookies, balises, SDK, stockage local et technologies similaires sur nos sites web et applications mobiles. Nous les utilisons pour authentifier les utilisateurs, sécuriser les Services, mémoriser les préférences, prévenir les abus, mesurer l’audience et améliorer la fiabilité et l’expérience.</p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">2) Qu’est-ce qu’un cookie et des technologies similaires ?</h3>
        <p>Un cookie est un petit fichier texte enregistré par votre navigateur ou appareil lors de la visite d’un site ou de l’usage d’une app. Des technologies proches incluent le localStorage/sessionStorage, les pixels/balises, les SDK mobiles et les identifiants d’appareil/de publicité (p. ex. IDFA/GAID).</p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">3) Pourquoi nous les utilisons</h3>
        <ul className="list-disc list-inside space-y-2 pl-4">
            <li>Authentification & sécurité ;</li>
            <li>Préférences & personnalisation ;</li>
            <li>Mesure & analytics ;</li>
            <li>Performance & fiabilité ;</li>
            <li>Publicité/marketing (le cas échéant) ;</li>
            <li>Prévention fraude/abus.</li>
        </ul>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">4) Gestion du consentement</h3>
        <p>Nous fournissons une bannière de consentement avec des catégories commutables et un lien « Paramètres des cookies » (pied de page du site et menu confidentialité in-app). Vos choix sont conservés via un cookie de préférence pendant 12 mois. Vous pouvez retirer votre consentement à tout moment via « Paramètres des cookies ». Les cookies strictement nécessaires restent actifs car indispensables à la fourniture du Service.</p>
        <p className="mt-2">La désactivation de certaines catégories peut dégrader ou désactiver des fonctionnalités (ex. maintien de session, cartes, historique de suivi).</p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">5) Catégories & finalités</h3>
        <ul className="list-none space-y-2 pl-4">
            <li><strong>A. Essentiels (Toujours actifs)</strong> — gestion de session, CSRF, équilibrage de charge, sécurité et parcours de paiement.</li>
            <li><strong>B. Fonctionnels (Opt-in)</strong> — langue/locale, préférences d’affichage, mémorisation du dernier numéro de suivi saisi pour accélérer vos recherches futures.</li>
            <li><strong>C. Mesure & Analytics (Opt-in)</strong> — GA4 / Firebase / Matomo pour comprendre l’usage et améliorer l’ergonomie.</li>
            <li><strong>D. Performance & Diagnostic (Opt-in)</strong> — Core Web Vitals, rapports de plantage, télémétrie anonymisée pour la fiabilité.</li>
            <li><strong>E. Sécurité & Anti-fraude (Opt-in lorsque non strictement nécessaires)</strong> — signaux d’intégrité d’appareil, détection d’anomalies, contrôle d’accès contextuel.</li>
            <li><strong>F. Publicité & Marketing (Opt-in)</strong> — mesure de campagnes, retargeting (si activé).</li>
            <li><strong>G. Réseaux sociaux (Opt-in)</strong> — boutons de partage, connexions sociales (si activées).</li>
        </ul>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">6) Exemples de cookies/SDK & durées</h3>
        <p>Une page « Liste des cookies » dynamique énumérera les éléments réellement déposés dans votre région/environnement.</p>
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 text-left">
              <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                      <th className="py-2 px-4 border-b">Catégorie</th>
                      <th className="py-2 px-4 border-b">Nom (exemple)</th>
                      <th className="py-2 px-4 border-b">Propriétaire</th>
                      <th className="py-2 px-4 border-b">Durée indicative</th>
                      <th className="py-2 px-4 border-b">Finalité</th>
                  </tr>
              </thead>
              <tbody>
                  <tr>
                      <td className="py-2 px-4 border-b">Essentiel</td>
                      <td className="py-2 px-4 border-b">session_id</td>
                      <td className="py-2 px-4 border-b">TiiBnTick</td>
                      <td className="py-2 px-4 border-b">Session</td>
                      <td className="py-2 px-4 border-b">Authentifier et maintenir la session</td>
                  </tr>
                  <tr>
                      <td className="py-2 px-4 border-b">Essentiel</td>
                      <td className="py-2 px-4 border-b">cookie_consent</td>
                      <td className="py-2 px-4 border-b">TiiBnTick</td>
                      <td className="py-2 px-4 border-b">12 mois</td>
                      <td className="py-2 px-4 border-b">Conserver vos préférences de consentement</td>
                  </tr>
                  <tr>
                      <td className="py-2 px-4 border-b">Sécurité</td>
                      <td className="py-2 px-4 border-b">csrf_token</td>
                      <td className="py-2 px-4 border-b">TiiBnTick</td>
                      <td className="py-2 px-4 border-b">Session</td>
                      <td className="py-2 px-4 border-b">Prévenir la falsification de requêtes</td>
                  </tr>
                  <tr>
                      <td className="py-2 px-4 border-b">Fonctionnel</td>
                      <td className="py-2 px-4 border-b">pnd_last_tracking_ref</td>
                      <td className="py-2 px-4 border-b">TiiBnTick</td>
                      <td className="py-2 px-4 border-b">30 jours</td>
                      <td className="py-2 px-4 border-b">Mémoriser le dernier numéro de suivi saisi</td>
                  </tr>
                   <tr>
                      <td className="py-2 px-4 border-b">Fonctionnel</td>
                      <td className="py-2 px-4 border-b">lang / locale</td>
                      <td className="py-2 px-4 border-b">TiiBnTick</td>
                      <td className="py-2 px-4 border-b">6 mois</td>
                      <td className="py-2 px-4 border-b">Langue et pays préférés</td>
                  </tr>
                  <tr>
                      <td className="py-2 px-4 border-b">Analytics</td>
                      <td className="py-2 px-4 border-b">_ga / clés GA4</td>
                      <td className="py-2 px-4 border-b">Google / TiiBnTick</td>
                      <td className="py-2 px-4 border-b">13 mois (EEE/RU)</td>
                      <td className="py-2 px-4 border-b">Mesure d’audience</td>
                  </tr>
                  <tr>
                      <td className="py-2 px-4 border-b">Performance</td>
                      <td className="py-2 px-4 border-b">cw_vitals</td>
                      <td className="py-2 px-4 border-b">TiiBnTick</td>
                      <td className="py-2 px-4 border-b">30 jours</td>
                      <td className="py-2 px-4 border-b">Indicateurs de performance</td>
                  </tr>
                  <tr>
                      <td className="py-2 px-4 border-b">Marketing</td>
                      <td className="py-2 px-4 border-b">_fbp</td>
                      <td className="py-2 px-4 border-b">Meta</td>
                      <td className="py-2 px-4 border-b">3 mois</td>
                      <td className="py-2 px-4 border-b">Mesure publicitaire/retargeting (si activé)</td>
                  </tr>
              </tbody>
          </table>
        </div>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">7) Spécificités applications mobiles</h3>
        <p>Nos apps peuvent intégrer des SDK (p. ex. Firebase/GA4, crash reporting, push).</p>
        <ul className="list-disc list-inside space-y-2 pl-4 my-2">
            <li><strong>Android :</strong> identifiant publicitaire GAID (réinitialisable). Réglages sous Paramètres `{'>'}` Google `{'>'}` Annonces.</li>
            <li><strong>iOS :</strong> identifiant publicitaire IDFA ; nous respectons App Tracking Transparency (ATT) et Réglages `{'>'}` Confidentialité.</li>
        </ul>
        <p>Nous différons l’initialisation des SDK non essentiels jusqu’à votre opt-in (le cas échéant) et proposons des interrupteurs in-app.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">8) Cookies/SDK tiers</h3>
        <p>Certains fournisseurs (cartographie, paiement, analytics, publicité) peuvent déposer leurs propres cookies/SDK pour fournir leurs services. Leur usage est régi par leurs politiques de confidentialité/cookies.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">9) Conservation</h3>
        <p>Les cookies de session expirent à la fermeture du navigateur/app. Les éléments persistants durent en général de 24 heures à 24 mois, selon la finalité et la région. La conservation des événements SDK est configurée sur des fenêtres similaires ou plus courtes.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">10) Vos choix</h3>
        <ul className="list-disc list-inside space-y-2 pl-4">
            <li>Utilisez le panneau Paramètres des cookies pour accepter/refuser par catégorie et retirer votre consentement à tout moment.</li>
            <li>Gérez les cookies dans votre navigateur (blocage/suppression peut affecter certaines fonctions).</li>
            <li>Contrôlez les identifiants d’appareil/de publicité sur Android/iOS.</li>
            <li>Utilisez les mécanismes d’opt-out publicitaires disponibles dans votre région.</li>
        </ul>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">11) Bases juridiques & portée géographique</h3>
        <p>Nous appliquons les bases légales adaptées selon votre localisation (p. ex. consentement pour analytics/marketing ; nécessité contractuelle ou intérêt légitime pour certains essentiels). Pour les visiteurs de l’EEE/Royaume-Uni, nous nous alignons sur le RGPD et la directive ePrivacy concernant le consentement aux cookies non essentiels.</p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">12) Mises à jour de la politique</h3>
        <p>Nous pouvons mettre à jour cette politique pour refléter des évolutions techniques, réglementaires ou de nos Services. Les modifications substantielles seront notifiées (bannière, in-app ou e-mail). La date de révision figure en tête du document.</p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">13) Contact</h3>
        <div className="space-y-1">
          <p><strong>Yowyob Inc. Ltd — Délégué à la protection des données</strong></p>
          <p>S/C 8390, Yaoundé, Cameroun</p>
          <p>E-mail : info@yowyob.com, privacy@yowyob.com</p>
          <p>Téléphone : +237 675 518 880 / +237 656 168 129</p>
        </div>

        {/* Annexes */}
        <div className="mt-8 pt-4 border-t">
          <h4 className="text-lg font-semibold mt-5 mb-2">Annexe A — Modèle « Paramètres des cookies » (implémentation)</h4>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>Entrée « Paramètres des cookies » persistante (footer sur web, menu confidentialité in-app).</li>
            <li>Commutateurs par catégorie avec impacts clairs.</li>
            <li>Liste des cookies/SDK auto-générée par environnement/région.</li>
            <li>Export des préférences (JSON).</li>
            <li>Durée du cookie de préférence : 12 mois.</li>
          </ul>

          <h4 className="text-lg font-semibold mt-5 mb-2">Annexe B — Notes pour développeurs</h4>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li><strong>Web :</strong> bannière CMP ; blocage préalable des tags non essentiels jusqu’au consentement ; stockage du consentement dans <code>cookie_consent</code> et/ou <code>localStorage</code>.</li>
            <li><strong>Mobile :</strong> interrupteurs in-app ; respect de l’ATT sur iOS ; différer les SDK marketing/analytics jusqu’au consentement.</li>
            <li>Prévoir une configuration privacy-by-default en staging/pré-prod.</li>
            <li>Publier la liste dynamique Cookie/SDK depuis la découverte au build ou à l’exécution.</li>
          </ul>
        </div>

      </>
    )
  },

  // ===================================
  // == Mentions Légales
  // ===================================
  'legal-notice': {
    title: "Mentions Légales",
    lastUpdated: "25 Mai 2024",
    content: () => (
      <>
        <h2 className="text-2xl font-bold mb-4 text-center">Mentions légales</h2>
        <p className="text-center text-gray-500">Version 2.0 – 19 avril 2025</p>
        <p className="text-center text-gray-500 mb-6">Applicables à l’ensemble des plateformes web et mobiles sous le domaine yowyob.com exploitées par Yowyob Inc. Ltd.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">1. Editeur du site</h3>
        <div className="pl-4 space-y-1">
          <p><strong>Dénomination sociale :</strong> Yowyob Inc. Ltd</p>
          <p><strong>Forme juridique :</strong> Société à responsabilité limitée de droit camerounais</p>
          <p><strong>Siège social :</strong> Situé au lieudit Carrefour Anguissa, Yaoundé-Cameroun ; S/C Yde 1er, Rue 1.121 Djoungolo,</p>
          <p><strong>Capital social :</strong> 1 000 000 FCFA</p>
          <p><strong>Registre du Commerce :</strong> RC/YAO/2020/B/1614</p>
          <p><strong>Numéro d’Identification Fiscale (NIF) :</strong> M102015282478U</p>
          <p><strong>Téléphone :</strong> +237 675 518 880</p>
          <p><strong>E‑mail :</strong> info@yowyob.com</p>
        </div>

        <h3 className="text-xl font-semibold mt-6 mb-3">2. Directeur·rice de la publication</h3>
        <div className="pl-4 space-y-1">
          <p><strong>Nom :</strong> Thomas Djotio Ndié</p>
          <p><strong>Fonction :</strong> Chief Executive Officer (CEO)</p>
          <p><strong>Contact :</strong> ceo@yowyob.com</p>
        </div>

        <h3 className="text-xl font-semibold mt-6 mb-3">3. Hébergeur</h3>
        <div className="pl-4 space-y-1">
          <p><strong>Société :</strong> OVHcloud SAS</p>
          <p><strong>Adresse :</strong> 2 Rue Kellermann, 59100 Roubaix, France</p>
          <p><strong>Téléphone :</strong> +33 9 72 10 10 07</p>
          <p><strong>Site web :</strong> <a href="https://www.ovhcloud.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://www.ovhcloud.com</a></p>
        </div>

        <h3 className="text-xl font-semibold mt-6 mb-3">4. Conception et développement</h3>
        <div className="pl-4 space-y-1">
          <p><strong>Développement back‑end :</strong> Yowyob Engineering Team (Java Spring Boot, ScyllaDB, PostgreSQL)</p>
          <p><strong>Développement front‑end :</strong> Yowyob UX Studio (Next.js, React Native)</p>
          <p><strong>UI/UX design :</strong> Yowyob Design Lab</p>
          <p><strong>Gestion de projet :</strong> Méthodologie agile Scrum – Jira / Confluence</p>
        </div>

        <h3 className="text-xl font-semibold mt-6 mb-3">5. Propriété intellectuelle</h3>
        <p>L’ensemble des contenus (textes, images, graphismes, logos, icônes, sons, logiciels, bases de données) présents sur les plateformes Yowyob sont protégés au titre du droit d’auteur et du droit des marques. Toute reproduction, représentation, diffusion ou exploitation, totale ou partielle, sans autorisation écrite préalable de Yowyob est strictement interdite.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">6. Protection des données personnelles</h3>
        <p>Yowyob collecte et traite vos données conformément à la Politique de confidentialité. Vous disposez d’un droit d’accès, de rectification, d’effacement et d’opposition que vous pouvez exercer auprès de notre Délégué à la Protection des Données :</p>
        <div className="pl-4 mt-2 space-y-1">
          <p><strong>E‑mail :</strong> privacy@yowyob.com</p>
          <p><strong>Téléphone :</strong> +237 675 518 880</p>
        </div>

        <h3 className="text-xl font-semibold mt-6 mb-3">7. Gestion des cookies</h3>
        <p>Pour plus d’informations sur l’usage des cookies, veuillez consulter notre Cookie Policy.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">8. Responsabilité</h3>
        <p>Yowyob met tout en œuvre pour offrir des informations fiables et une disponibilité continue de ses services. Toutefois, Yowyob ne saurait être tenu responsable :</p>
        <ol className="list-decimal list-inside space-y-2 pl-4 mt-2">
          <li>des interruptions du service pour maintenance ou mises à jour ;</li>
          <li>des dommages résultant d’une intrusion frauduleuse d’un tiers ;</li>
          <li>des imprécisions ou omissions portant sur les informations disponibles ;</li>
          <li>d’éventuels dysfonctionnements liés au réseau Internet ou à l’infrastructure locale.</li>
        </ol>

        <h3 className="text-xl font-semibold mt-6 mb-3">9. Liens hypertextes</h3>
        <p>Les plateformes Yowyob peuvent contenir des liens vers des sites tiers. Yowyob n’exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu ou à leur politique de confidentialité.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">10. Droit applicable et juridictions compétentes</h3>
        <p>Les présentes mentions légales sont régies par le droit camerounais. Tout litige sera porté devant les tribunaux compétents de Yaoundé, sous réserve des dispositions légales impératives.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">11. Modification des mentions légales</h3>
        <p>Yowyob se réserve le droit de modifier les présentes mentions légales à tout moment. Les utilisateurs sont invités à les consulter régulièrement.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">12. Contact</h3>
        <p>Pour toute question relative au site ou à son contenu :</p>
        <div className="pl-4 mt-2 space-y-1">
          <p><strong>Service juridique :</strong> legal@yowyob.com</p>
          <p><strong>Service technique :</strong> support@yowyob.com</p>
          <p><strong>Téléphone :</strong> +237 675 518 880</p>
          <p className="font-semibold pt-2">Social contacts :</p>
          <ul className="list-disc list-inside space-y-1">
            <li><a href="https://twitter.com/yowyob" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://twitter.com/yowyob</a></li>
            <li><a href="https://www.facebook.com/YowyobInc" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://www.facebook.com/YowyobInc</a></li>
            <li><a href="https://www.instagram.com/yowyob" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://www.instagram.com/yowyob</a></li>
            <li><a href="https://linkedin.com/yowyob" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://linkedin.com/yowyob</a></li>
          </ul>
        </div>
        
        <p className="text-center mt-8 text-sm text-gray-600">© 2025 Yowyob Inc. Ltd. Tous droits réservés.</p>
      </>
    )
  },

  // ===================================
  // == Politique de Lutte contre la Fraude (BONUS)
  // ===================================
  'fraud-policy': {
    title: "Politique de Lutte contre la Fraude",
    lastUpdated: "25 Mai 2024",
    content: () => (
      <>
          <h2 className="text-2xl font-bold mb-2">Yowyob TiiBnTick — Fraud Awareness / Sensibilisation à la fraude</h2>
          <p className="text-sm text-gray-600">Version 1.0 — 02 Sep 2025</p>
          <p className="text-sm text-gray-600 mb-8">Service Owner: Yowyob Inc. Ltd. (TiiBnTick)</p>

          {/* PARTIE ANGLAISE */}
          <div id="english-section">
              <h2 className="text-2xl font-bold mt-8 mb-4 border-b pb-2">PART I — ENGLISH (Standalone)</h2>

              <h3 className="text-xl font-semibold mt-6 mb-3">1) Purpose & Scope</h3>
              <p>This page helps you recognize and avoid fraud attempts that misuse TiiBnTick’s name, logo, tracking, or communication channels. It applies to our websites, mobile apps, and official social channels.</p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">2) How fraudsters operate (typical patterns)</h3>
              <ul className="list-disc list-inside space-y-2 pl-4">
                  <li>Impersonation via emails/SMS/WhatsApp that look official and ask you to pay a fee (e.g., “customs”, “redelivery”, “address correction”) before delivery.</li>
                  <li>Fake tracking links or websites with look‑alike domains; shortened URLs that hide their destination.</li>
                  <li>Messages urging you to install an app from a link in SMS to track a parcel or to unlock delivery.</li>
                  <li>Job offers and onboarding requests that demand up‑front payments or detailed personal data.</li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">3) Red flags & safe actions</h3>
              <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                      <thead>
                          <tr className="bg-gray-100">
                              <th className="border p-3 text-left font-semibold">Red flag</th>
                              <th className="border p-3 text-left font-semibold">What to do</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr>
                              <td className="border p-3">Request for payment via SMS/WhatsApp or by gift cards/airtime</td>
                              <td className="border p-3">Do not pay; only pay inside the TiiBnTick app/website or at official partner points</td>
                          </tr>
                          <tr>
                              <td className="border p-3">Link to download an APK/app from SMS</td>
                              <td className="border p-3">Do not install; obtain apps only from Google Play or Apple App Store</td>
                          </tr>
                          <tr>
                              <td className="border p-3">Sender email/domain looks odd (misspellings, subdomains)</td>
                              <td className="border p-3">Verify the domain carefully; when in doubt, contact TiiBnTick Support</td>
                          </tr>
                          <tr>
                              <td className="border p-3">Shortened links (bit.ly, tinyurl) or mismatched addresses</td>
                              <td className="border p-3">Don’t click; access tracking from our official site/app</td>
                          </tr>
                          <tr>
                              <td className="border p-3">Pressure tactics (“pay in 30 minutes or parcel destroyed”)</td>
                              <td className="border p-3">Stop. Verify with us via official channels before acting</td>
                          </tr>
                          <tr>
                              <td className="border p-3">Attachments you did not expect</td>
                              <td className="border p-3">Don’t open; scan with security software and contact Support</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">4) How TiiBnTick contacts you</h3>
              <ul className="list-disc list-inside space-y-2 pl-4">
                  <li>We may send transactional emails/SMS/push strictly related to your shipments (e.g., pickup window, status changes).</li>
                  <li>We do not ask you to disclose passwords or one‑time codes (OTP).</li>
                  <li>We do not send APKs or ask you to install apps from links in SMS. Install only from official app stores.</li>
                  <li>We only collect money for official TiiBnTick delivery services (e.g., shipping or service fees shown in the app/site). We don’t demand payments for unrelated third‑party goods.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">5) Payments & fees — safe practices</h3>
              <ul className="list-disc list-inside space-y-2 pl-4">
                  <li>Pay within the TiiBnTick app/website or via listed partners only.</li>
                  <li>For mobile‑money (e.g., MoMo, Orange Money), verify the payee name and amount before confirming.</li>
                  <li>Never send money to individuals who contact you privately claiming to be TiiBnTick.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">6) Suspect a message? Do this.</h3>
              <ol className="list-decimal list-inside space-y-2 pl-4">
                  <li>Do not click links, do not pay, do not share personal data.</li>
                  <li>Take a screenshot and note the sender and time.</li>
                  <li>Report it to <strong>abuse@yowyob.com</strong> (attach the suspicious email as a file if possible) or via the in‑app Help.</li>
                  <li>Delete the message or block the number/sender after reporting.</li>
              </ol>

              <h3 className="text-xl font-semibold mt-6 mb-3">7) If you already paid or clicked</h3>
              <ul className="list-disc list-inside space-y-2 pl-4">
                  <li>Immediately contact your bank/mobile‑money provider to block/trace the transaction.</li>
                  <li>Change your passwords and enable 2FA where relevant.</li>
                  <li>Run a malware scan and uninstall any app you installed from suspicious links.</li>
                  <li>Consider filing a report with local authorities.</li>
                  <li>Inform us at <strong>abuse@yowyob.com</strong> so we can take down fraudulent pages.</li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">8) Protect yourself — quick checklist</h3>
              <ul className="list-disc list-inside space-y-2 pl-4">
                  <li>Verify tracking numbers inside the official app/site.</li>
                  <li>Check domains carefully before entering data or paying.</li>
                  <li>Keep your device and apps updated, use a reputable security solution, and back up regularly.</li>
                  <li>Be wary of urgent or too‑good‑to‑be‑true messages.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">9) Third‑party sites & social accounts</h3>
              <p>Fraudsters often create look‑alike sites and social profiles. Only trust links published on our official domains or app. We are not responsible for third‑party sites or content that misuse our brand.</p>

              <h3 className="text-xl font-semibold mt-6 mb-3">10) Legal notice</h3>
              <p>Unauthorised use of the TiiBnTick brand, trademarks, and content is prohibited. We reserve the right to take down fraudulent content and to cooperate with authorities.</p>

              <h3 className="text-xl font-semibold mt-6 mb-3">11) Contact</h3>
              <ul className="list-disc list-inside space-y-2 pl-4">
                  <li>Report fraud/phishing: <strong>abuse@yowyob.com</strong></li>
                  <li>Customer support: <strong>support@yowyob.com</strong></li>
                  <li>Legal: <strong>legal@yowyob.com</strong></li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">12) Updates</h3>
              <p>We may update this page to reflect new fraud patterns or security measures. The date at the top shows the latest revision.</p>
          </div>

          <hr className="my-12" />

          {/* PARTIE FRANÇAISE */}
          <div id="french-section">
              <h2 className="text-2xl font-bold mt-8 mb-4 border-b pb-2">PART II — FRANÇAIS (Autonome)</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">1) Objet & Portée</h3>
              <p>Cette page vous aide à reconnaître et éviter les tentatives de fraude qui usurpent le nom, le logo, le suivi ou les canaux de communication de TiiBnTick. Elle couvre nos sites web, applications mobiles et comptes officiels.</p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">2) Comment opèrent les fraudeurs (schémas typiques)</h3>
              <ul className="list-disc list-inside space-y-2 pl-4">
                  <li>Usurpation via e‑mails/SMS/WhatsApp imitant l’officiel et réclamant un paiement (ex. « douanes », « re‑livraison », « correction d’adresse ») avant la livraison.</li>
                  <li>Liens de suivi ou sites factices avec domaines ressemblants ; URL raccourcies masquant la destination.</li>
                  <li>Messages incitant à installer une application depuis un lien SMS pour suivre un colis ou débloquer une livraison.</li>
                  <li>Offres d’emploi et demandes d’onboarding exigeant des paiements initiaux ou des données personnelles étendues.</li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">3) Signaux d’alerte & gestes sûrs</h3>
              <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                      <thead>
                          <tr className="bg-gray-100">
                              <th className="border p-3 text-left font-semibold">Signal d’alerte</th>
                              <th className="border p-3 text-left font-semibold">Que faire</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr>
                              <td className="border p-3">Demande de paiement par SMS/WhatsApp ou via cartes cadeaux/crédit télécom</td>
                              <td className="border p-3">Ne payez pas ; payez dans l’app/site TiiBnTick ou chez des partenaires officiels</td>
                          </tr>
                          <tr>
                              <td className="border p-3">Lien pour télécharger une APK/app depuis un SMS</td>
                              <td className="border p-3">N’installez pas ; téléchargez uniquement depuis Google Play ou Apple App Store</td>
                          </tr>
                          <tr>
                              <td className="border p-3">Adresse e‑mail/domaine douteux (fautes, sous‑domaines suspects)</td>
                              <td className="border p-3">Vérifiez le domaine ; en cas de doute contactez l’Assistance</td>
                          </tr>
                          <tr>
                              <td className="border p-3">Liens raccourcis (bit.ly, tinyurl) ou adresses incohérentes</td>
                              <td className="border p-3">Ne cliquez pas ; accédez au suivi depuis le site/app officiel(le)</td>
                          </tr>
                          <tr>
                              <td className="border p-3">Pression (« payez dans 30 min ou colis détruit »)</td>
                              <td className="border p-3">Stop. Vérifiez auprès de nous via les canaux officiels</td>
                          </tr>
                          <tr>
                              <td className="border p-3">Pièces jointes inattendues</td>
                              <td className="border p-3">N’ouvrez pas ; analysez et contactez l’Assistance</td>
                          </tr>
                      </tbody>
                  </table>
              </div>

              <h3 className="text-xl font-semibold mt-6 mb-3">4) Comment TiiBnTick vous contacte</h3>
              <ul className="list-disc list-inside space-y-2 pl-4">
                  <li>Nous envoyons des e‑mails/SMS/push transactionnels strictement liés à vos envois (ex. créneau d’enlèvement, changement d’état).</li>
                  <li>Nous ne demandons jamais vos mots de passe ni codes OTP.</li>
                  <li>Nous n’envoyons pas d’APK et ne vous demandons pas d’installer une app via un lien SMS. Installez uniquement depuis les stores officiels.</li>
                  <li>Nous ne percevons que des frais liés aux services de livraison TiiBnTick (ex. frais affichés dans l’app/le site). Nous ne réclamons pas de paiements pour des marchandises tierces non liées.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">5) Paiements & frais — bonnes pratiques</h3>
              <ul className="list-disc list-inside space-y-2 pl-4">
                  <li>Payez dans l’app/site TiiBnTick ou via les partenaires listés uniquement.</li>
                  <li>Pour la money mobile (p. ex. MoMo, Orange Money), vérifiez le nom du bénéficiaire et le montant avant de valider.</li>
                  <li>N’envoyez jamais d’argent à des particuliers qui vous contactent en prétendant être TiiBnTick.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">6) Message suspect ? Réagissez ainsi</h3>
              <ol className="list-decimal list-inside space-y-2 pl-4">
                  <li>Ne cliquez pas sur les liens, ne payez pas, ne communiquez pas de données.</li>
                  <li>Faites une capture d’écran et notez l’expéditeur et l’heure.</li>
                  <li>Signalez à <strong>abuse@yowyob.com</strong> (joignez l’e‑mail suspect en pièce jointe si possible) ou via l’Aide dans l’app.</li>
                  <li>Supprimez le message ou bloquez le numéro/l’expéditeur après signalement.</li>
              </ol>

              <h3 className="text-xl font-semibold mt-6 mb-3">7) Si vous avez déjà payé ou cliqué</h3>
              <ul className="list-disc list-inside space-y-2 pl-4">
                  <li>Contactez immédiatement votre banque/opérateur de money mobile pour bloquer/suivre la transaction.</li>
                  <li>Changez vos mots de passe et activez la 2FA si pertinent.</li>
                  <li>Lancez une analyse anti‑malware et désinstallez toute app installée depuis un lien suspect.</li>
                  <li>Envisagez un dépôt de plainte auprès des autorités locales.</li>
                  <li>Informez‑nous via <strong>abuse@yowyob.com</strong> afin que nous procédions aux retraits de contenus frauduleux.</li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">8) Protégez‑vous — checklist rapide</h3>
              <ul className="list-disc list-inside space-y-2 pl-4">
                  <li>Vérifiez les numéros de suivi dans le site/app officiel(le).</li>
                  <li>Contrôlez les noms de domaine avant de saisir des données ou de payer.</li>
                  <li>Maintenez à jour vos appareils et apps, utilisez une solution de sécurité et faites des sauvegardes régulières.</li>
                  <li>Méfiez‑vous des messages urgents ou trop beaux pour être vrais.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">9) Sites et comptes tiers</h3>
              <p>Les fraudeurs créent des sites et comptes sociaux très ressemblants. Ne faites confiance qu’aux liens publiés sur nos domaines officiels ou dans l’app. Nous déclinons toute responsabilité pour les sites/contenus tiers usurpant notre marque.</p>

              <h3 className="text-xl font-semibold mt-6 mb-3">10) Mention légale</h3>
              <p>L’usage non autorisé de la marque, des logos et contenus TiiBnTick est interdit. Nous nous réservons le droit de faire retirer les contenus frauduleux et de coopérer avec les autorités.</p>

              <h3 className="text-xl font-semibold mt-6 mb-3">11) Contact</h3>
              <ul className="list-disc list-inside space-y-2 pl-4">
                  <li>Signaler une fraude/phishing : <strong>abuse@yowyob.com</strong></li>
                  <li>Support client : <strong>support@yowyob.com</strong></li>
                  <li>Juridique : <strong>legal@yowyob.com</strong></li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">12) Mises à jour</h3>
              <p>Nous pouvons mettre à jour cette page pour refléter l’évolution des schémas de fraude ou des mesures de sécurité. La date en tête indique la dernière révision.</p>
          </div>
      </>
    )
  }
};