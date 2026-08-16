import { PartyModel } from '../models/party.model.js';

export const PartyService = {
  async getParties(params) {
    // Run master data sync first so all newly added employees/suppliers/customers/labour exist as parties
    await PartyModel.syncPartiesFromMaster();
    return await PartyModel.getAllParties(params);
  },

  async getPartyProfile(id) {
    const party = await PartyModel.getPartyById(id);
    if (!party) throw new Error('Party / Recipient profile not found.');
    return party;
  },

  async createParty(partyData) {
    if (!partyData.name || !partyData.party_type) {
      throw new Error('Party Name and Party Type are required.');
    }
    return await PartyModel.createParty(partyData);
  },

  async updateParty(id, updateData) {
    const existing = await PartyModel.getPartyById(id);
    if (!existing) throw new Error('Party / Recipient profile not found.');
    return await PartyModel.updateParty(id, updateData);
  },
};
